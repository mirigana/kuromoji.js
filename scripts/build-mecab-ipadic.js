const fs = require('fs');
const path = require('path');
const IPADIC = require('mecab-ipadic-seed');
const kuromoji = require('../src/kuromoji.js');

const MECAB_IPADIC_DIRECTORY = '.cache/ipadic';
const DICT_OUTPUT_DIRECTORY = 'dict';

function createDirectorySync(dpath) {
  if (!fs.existsSync(dpath)) {
    fs.mkdirSync(dpath, { recursive: true });
  }
}

createDirectorySync(MECAB_IPADIC_DIRECTORY);
createDirectorySync(DICT_OUTPUT_DIRECTORY);

// Convert Int32Array to Buffer
function toBuffer(typed) {
  return Buffer.from(typed.buffer);
}

// remove usless entity feature to reduce the size of the dictionary
const maskUslessFeatures = (line) => {
  return line;

  // clear the usless features, it can reduce about 20% of the dict files
  // **
  // considerate the usage of token rules
  // when overwrite the below token parts
  // some rule rely the partiular properties
  // **

  const parts = line.split(',');

  // const pos = parts[4];
  // let posIndex = posTypesMap[pos];
  // if (posIndex === undefined) {
  //   posTypesMap.lastIndex += 1;
  //   posTypesMap[pos] = posTypesMap.lastIndex;
  //   posIndex = posTypesMap.lastIndex;
  // }

  // parts[0] = ''; // surface_form
  // parts[1] = ''; // left
  // parts[2] = ''; // right
  // parts[3] = ''; // cost
  // parts[4] = posIndex.toString(); // pos
  parts[5] = ''; // pos_detail_1
  parts[6] = ''; // pos_detail_2
  parts[7] = ''; // pos_detail_3
  parts[8] = ''; // conjugated_type
  parts[9] = ''; // conjugated_form
  parts[10] = ''; // basic_form
  // parts[11] = ''; // reading
  parts[12] = ''; // pronunciation

  return parts.join(',');
};


const addCustomTokenInfo = (builder) => {
  const custom = [
    '令和,1288,1288,8142,名詞,固有名詞,一般,*,*,*,令和,レイワ,レイワ',
    '林愛夏,1289,1289,7251,名詞,固有名詞,人名,一般,*,*,林愛夏,ハヤシマナツ,ハヤシマナツ',
    '大矢梨華子,1289,1289,6278,名詞,固有名詞,人名,一般,*,*,大矢梨華子,オオヤリカコ,オーヤリカコ',
    '傳谷英里香,1289,1289,6278,名詞,固有名詞,人名,一般,*,*,傳谷英里香,デンヤエリカ,デンヤエリカ',
    '高見奈央,1289,1289,4504,名詞,固有名詞,人名,一般,*,*,高見奈央,タカミナオ,タカミナオ',
    '渡邊璃生,1289,1289,6024,名詞,固有名詞,人名,一般,*,*,渡邊璃生,ワタナベリオ,ワタナベリオ',
    '西井万理那,1289,1289,6278,名詞,固有名詞,人名,一般,*,*,西井万理那,ニシイマリナ,ニシーマリナ',
    '東理紗,1289,1289,7251,名詞,固有名詞,人名,一般,*,*,東理紗,アズマリサ,アズマリサ',
    '廣川奈々聖,1289,1289,6278,名詞,固有名詞,人名,一般,*,*,廣川奈々聖,ヒロカワナナセ,ヒロカワナナセ',
    '松田美里,1289,1289,2974,名詞,固有名詞,人名,一般,*,*,松田美里,マツダミリ,マツダミリ',
    '三品瑠香,1289,1289,3921,名詞,固有名詞,人名,一般,*,*,三品瑠香,ミシナルカ,ミシナルカ',
    '小玉梨々華,1289,1289,6278,名詞,固有名詞,人名,一般,*,*,小玉梨々華,コダマリリカ,コダマリリカ',
    '坂元葉月,1289,1289,4776,名詞,固有名詞,人名,一般,*,*,坂元葉月,サカモトハヅキ,サカモトハズキ',
  ];

  custom.forEach((line) => {
    builder.addTokenInfoDictionary(maskUslessFeatures(line));
  });
};


(async () => {
  // download and patch the dictionaries
  await IPADIC.prepareDictionaries({
    neologd: false,
    dictPath: MECAB_IPADIC_DIRECTORY,
  });


  const ipaDic = new IPADIC(MECAB_IPADIC_DIRECTORY);
  const builder = kuromoji.dictionaryBuilder();

  // Build token info dictionary
  const tokenInfoPromise = ipaDic.readTokenInfo((line) => {
    builder.addTokenInfoDictionary(maskUslessFeatures(line));
  }).then(() => {
    console.log('Finishied to read token info dics');
  });

  // Build connection costs matrix
  const matrixDefPromise = ipaDic.readMatrixDef((line) => {
    builder.putCostMatrixLine(line);
  }).then(() => {
    console.log('Finishied to read matrix.def');
  });

  // Build unknown dictionary
  const unkDefPromise = ipaDic.readUnkDef((line) => {
    builder.putUnkDefLine(line);
  }).then(() => {
    console.log('Finishied to read unk.def');
  });

  // Build character definition dictionary
  const charDefPromise = ipaDic.readCharDef((line) => {
    builder.putCharDefLine(line);
  }).then(() => {
    console.log('Finishied to read char.def');
  });

  await Promise.all([
    tokenInfoPromise,
    matrixDefPromise,
    unkDefPromise,
    charDefPromise,
  ]);

  addCustomTokenInfo(builder);

  console.log('');
  console.log('Finishied to read all seed dictionary files');
  console.log('Building binary dictionary ...');

  const dic = await builder.build();
  const base_buffer = toBuffer(dic.trie.bc.getBaseBuffer());
  const check_buffer = toBuffer(dic.trie.bc.getCheckBuffer());
  const token_info_buffer = toBuffer(dic.token_info_dictionary.dictionary.buffer);
  const tid_pos_buffer = toBuffer(dic.token_info_dictionary.pos_buffer.buffer);
  const tid_map_buffer = toBuffer(dic.token_info_dictionary.targetMapToBuffer());
  const connection_costs_buffer = toBuffer(dic.connection_costs.buffer);
  const unk_buffer = toBuffer(dic.unknown_dictionary.dictionary.buffer);
  const unk_pos_buffer = toBuffer(dic.unknown_dictionary.pos_buffer.buffer);
  const unk_map_buffer = toBuffer(dic.unknown_dictionary.targetMapToBuffer());
  const char_map_buffer = toBuffer(dic.unknown_dictionary.character_definition.character_category_map);
  const char_compat_map_buffer = toBuffer(dic.unknown_dictionary.character_definition.compatible_category_map);
  const invoke_definition_map_buffer = toBuffer(dic.unknown_dictionary.character_definition.invoke_definition_map.toBuffer());

  fs.writeFileSync(path.join(DICT_OUTPUT_DIRECTORY, 'base.dat'), base_buffer);
  fs.writeFileSync(path.join(DICT_OUTPUT_DIRECTORY, 'check.dat'), check_buffer);
  fs.writeFileSync(path.join(DICT_OUTPUT_DIRECTORY, 'tid.dat'), token_info_buffer);
  fs.writeFileSync(path.join(DICT_OUTPUT_DIRECTORY, 'tid_pos.dat'), tid_pos_buffer);
  fs.writeFileSync(path.join(DICT_OUTPUT_DIRECTORY, 'tid_map.dat'), tid_map_buffer);
  fs.writeFileSync(path.join(DICT_OUTPUT_DIRECTORY, 'cc.dat'), connection_costs_buffer);
  fs.writeFileSync(path.join(DICT_OUTPUT_DIRECTORY, 'unk.dat'), unk_buffer);
  fs.writeFileSync(path.join(DICT_OUTPUT_DIRECTORY, 'unk_pos.dat'), unk_pos_buffer);
  fs.writeFileSync(path.join(DICT_OUTPUT_DIRECTORY, 'unk_map.dat'), unk_map_buffer);
  fs.writeFileSync(path.join(DICT_OUTPUT_DIRECTORY, 'unk_char.dat'), char_map_buffer);
  fs.writeFileSync(path.join(DICT_OUTPUT_DIRECTORY, 'unk_compat.dat'), char_compat_map_buffer);
  fs.writeFileSync(path.join(DICT_OUTPUT_DIRECTORY, 'unk_invoke.dat'), invoke_definition_map_buffer);

  console.log('Dict built from mecab-ipadic-seed done.');
})();
