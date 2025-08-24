/*
 * Copyright 2014 Takuya Asano
 * Copyright 2010-2014 Atilika Inc. and contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


const ViterbiBuilder = require('./viterbi/ViterbiBuilder');
const ViterbiSearcher = require('./viterbi/ViterbiSearcher');
const IpadicFormatter = require('./util/IpadicFormatter');

const PUNCTUATION = /、|。/;


class Tokenizer {
  /**
   * Tokenizer
   * @param {DynamicDictionaries} dic Dictionaries used by this tokenizer
   * @constructor
   */
  constructor(dic) {
    this.token_info_dictionary = dic.token_info_dictionary;
    this.unknown_dictionary = dic.unknown_dictionary;
    this.viterbi_builder = new ViterbiBuilder(dic);
    this.viterbi_searcher = new ViterbiSearcher(dic.connection_costs);
    this.formatter = new IpadicFormatter(); // TODO Other dictionaries
  }

  /**
   * Tokenize text
   * @param {string} text Input text to analyze
   * @returns {Array} Tokens
   */
  tokenize(text) {
    const sentences = Tokenizer.splitByPunctuation(text);
    const tokens = [];
    sentences.forEach((sentence) => {
      this.tokenizeForSentence(sentence, tokens);
    });
    return tokens;
  }

  tokenizeForSentence(sentence, tokens = []) {
    const lattice = this.getLattice(sentence);
    const best_path = this.viterbi_searcher.search(lattice);
    const last_token = tokens[tokens.length - 1];
    const initial_pos = last_token
      ? last_token.word_position + last_token.surface_form.length - 1
      : 0;

    best_path.forEach((node) => {
      let features = [];
      let token = null;

      // TODO extract node types
      if (node.type === 'KNOWN') {
        const features_line = this.token_info_dictionary.getFeatures(node.name);

        if (features_line) {
          features = features_line.split(',');
        }

        token = this.formatter.formatEntry(
          node.name,
          initial_pos + node.start_pos,
          node.type,
          features,
        );
      } else if (node.type === 'UNKNOWN') {
        // Unknown word
        const features_line = this.unknown_dictionary.getFeatures(node.name);
        features = features_line.split(',');

        token = this.formatter.formatUnknownEntry(
          node.name,
          initial_pos + node.start_pos,
          node.type,
          features,
          node.surface_form,
        );
      } else {
        // TODO User dictionary
        token = this.formatter.formatEntry(node.name, initial_pos + node.start_pos, node.type, []);
      }

      tokens.push(token);
    });

    return tokens;
  }

  /**
   * Build word lattice
   * @param {string} text Input text to analyze
   * @returns {ViterbiLattice} Word lattice
   */
  getLattice(text) {
    return this.viterbi_builder.build(text);
  }


  /**
   * Split into sentence by punctuation
   * @param {string} input Input text
   * @returns {Array.<string>} Sentences end with punctuation
   */
  static splitByPunctuation(input) {
    const sentences = [];
    let tail = input;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (tail === '') {
        break;
      }
      const index = tail.search(PUNCTUATION);
      if (index < 0) {
        sentences.push(tail);
        break;
      }
      sentences.push(tail.substring(0, index + 1));
      tail = tail.substring(index + 1);
    }
    return sentences;
  }
}


module.exports = Tokenizer;
