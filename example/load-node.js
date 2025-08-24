/*
 * Copyright Copyright 2014 Takuya Asano
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

const kuromoji = require('../src/kuromoji');

const DIC_DIR = 'dict';

// node --inspect-brk example/load-node.js

let text = '！。！天才てれびくんを見た時かな。しゅごキャラ！を見た時かな。リルぷりっ♪を見た時かな。とにかく昔から歌と踊りと、なにかを生み出すことが好きだったんだ〜。誰にも見せないのに、曲を作ったり詞を作ったり。振り付けを作ったりセリフを作ったり。小説を書いたり漫画を描いたり。世の中の「創作」と呼ばれるものは一通りやってきた気がする。つくるの、大好き。アイドルになって、自分で作った歌を披露させていただける機会があってうれしかった。これはデビュー前から言い続けていることなのですが、いつかグループの曲を作ったり、歌詞を書いたり、振り付けをしたり、なんだり、してみたいなのきもちです。';
text = '⌒+。本日';
// text = '本日\n\n7/4(金)';

// Load dictionaries from file, and prepare tokenizer
kuromoji.builder({ dicPath: DIC_DIR }).build().then((tokenizer) => {
  const path = tokenizer.tokenize(text);
  console.log(path);
  module.exports = tokenizer;
});
