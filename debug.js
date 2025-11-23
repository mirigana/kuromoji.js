const fs = require('fs');

const kuromoji = require('./src/kuromoji.js');
const Tokenizer = require('./src/Tokenizer');
const CharacterDefinitionBuilder = require('./src/dict/builder/CharacterDefinitionBuilder');

const DIC_DIR = 'dict';
// const DIC_DIR = './test/resource/minimum-dic/';

// const result = Tokenizer.splitByPunctuation('すもももももももものうち');
// console.log(result);


const text = 'なにかを生み出すことが好きだったんだ〜。誰にも見せないのに、曲を作ったり詞を作ったり';
kuromoji.builder({ dicPath: DIC_DIR }).build((_tokenizer) => {
  const result = _tokenizer.tokenize(text);
  console.log(result);
});


// const cd_builder = new CharacterDefinitionBuilder();
// fs.readFileSync(`${DIC_DIR}char.def`, 'utf-8')
//   .split('\n')
//   .forEach((line) => {
//     cd_builder.putLine(line);
//   });
// const char_def = cd_builder.build();

// console.log(char_def.lookup('日'));
