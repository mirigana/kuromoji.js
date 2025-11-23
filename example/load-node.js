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

let text = '公式アカウント錬成企画\n\n【TCHOTCHKEにまつわるQ&A】\n\nリプの応酬が白熱してるアカウントがインプ伸びると聞いたもので。TRIPもないので今週、試験的に本投稿へのリプライというカタチで頂戴した質問にぽつぽつ答えてみたいと思います。\n\nいい塩梅でお願いし〼。\n（urlも貼らない施策）';
// text = '本日\n\n7/4(金)';

// Load dictionaries from file, and prepare tokenizer
kuromoji.builder({ dicPath: DIC_DIR }).build().then((tokenizer) => {
  const path = tokenizer.tokenize(text);
  // console.log(path);

  // build resut test
  const kataToHira = (str = '') => str.replace(/[\u30a1-\u30f6]/g, (match) => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });

  const pured = path
    .filter((t) => /[\u4E00-\u9FFF]/.test(t.surface_form))
    .filter((t) => t.reading)
    .map((t) => ({
      s: t.surface_form,
      r: kataToHira(t.reading),
      p: t.word_position - 1,
    }));

  const textArray = text.split('');

  pured.forEach((p) => {
    console.log(p);
    textArray[p.p + (p.s.length - 1)] += `(${p.r})`;
  });

  console.log(textArray.join(''));

  module.exports = tokenizer;
});
