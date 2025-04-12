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


const DynamicDictionaries = require('../dict/DynamicDictionaries');


class DictionaryLoaderBase {
  /**
   * DictionaryLoader base constructor
   * @param {string} dic_path Dictionary path
   * @constructor
   */
  constructor(dic_path = '') {
    this.dic = new DynamicDictionaries();
    this.dic_path = dic_path;
    if (!this.dic_path.endsWith('/')) {
      // suffix "/" is require for url.resolve()
      this.dic_path += '/';
    }
  }

  loadFiles(files) {
    const { dic_path } = this;
    return Promise.all(
      files.map((file) => this.loadArrayBuffer(file, dic_path)),
    );
  }

  loadTrie() {
    const files = ['base.dat', 'check.dat'];

    return this.loadFiles(files).then(([base, check]) => {
      const base_buffer = new Int32Array(base);
      const check_buffer = new Int32Array(check);

      this.dic.loadTrie(base_buffer, check_buffer);
    });
  }

  loadToken() {
    const files = ['tid.dat', 'tid_pos.dat', 'tid_map.dat'];

    return this.loadFiles(files).then(([token_info, pos, target_map]) => {
      const token_info_buffer = new Uint8Array(token_info);
      const pos_buffer = new Uint8Array(pos);
      const target_map_buffer = new Uint8Array(target_map);

      this.dic.loadTokenInfoDictionaries(token_info_buffer, pos_buffer, target_map_buffer);
    });
  }

  loadCostMatrix() {
    const files = ['cc.dat'];

    return this.loadFiles(files).then(([cc]) => {
      const cc_buffer = new Int16Array(cc);

      this.dic.loadConnectionCosts(cc_buffer);
    });
  }

  loadUnknownDictionaries() {
    const files = ['unk.dat', 'unk_pos.dat', 'unk_map.dat', 'unk_char.dat', 'unk_compat.dat', 'unk_invoke.dat'];

    return this.loadFiles(files).then(([unk, unk_pos, unk_map, unk_char, unk_compat, unk_invoke]) => {
      const unk_buffer = new Uint8Array(unk);
      const unk_pos_buffer = new Uint8Array(unk_pos);
      const unk_map_buffer = new Uint8Array(unk_map);
      const unk_char_buffer = new Uint8Array(unk_char);
      const unk_compat_buffer = new Uint8Array(unk_compat);
      const unk_invoke_buffer = new Uint8Array(unk_invoke);

      this.dic.loadUnknownDictionaries(unk_buffer, unk_pos_buffer, unk_map_buffer, unk_char_buffer, unk_compat_buffer, unk_invoke_buffer);
    });
  }

  /**
   * Load dictionary files
   */
  load() {
    return Promise.all([
      this.loadTrie(),
      this.loadToken(),
      this.loadCostMatrix(),
      this.loadUnknownDictionaries(),
    ]).then(() => this.dic);
  }
}


module.exports = DictionaryLoaderBase;
