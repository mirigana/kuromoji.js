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


const InvokeDefinitionMap = require('./InvokeDefinitionMap');
const CharacterClass = require('./CharacterClass');

const DEFAULT_CATEGORY = 'DEFAULT';


class CharacterDefinition {
  /**
   * CharacterDefinition represents char.def file and
   * defines behavior of unknown word processing
   * @constructor
   */
  constructor() {
    // for all UCS2 code points
    this.character_category_map = new Uint8Array(65536);
    // for all UCS2 code points
    this.compatible_category_map = new Uint32Array(65536);
    this.invoke_definition_map = null;
  }

  /**
   * Initializing method
   * @param {Array} category_mapping Array of category mapping
   */
  initCategoryMappings(category_mapping) {
    // Initialize map by DEFAULT class
    let code_point;
    if (category_mapping != null) {
      for (let i = 0; i < category_mapping.length; i += 1) {
        const mapping = category_mapping[i];
        const end = mapping.end || mapping.start;
        for (code_point = mapping.start; code_point <= end; code_point += 1) {
          // Default Category class ID
          this.character_category_map[code_point] = this.invoke_definition_map.lookup(mapping.default);

          let bitset;
          for (let j = 0; j < mapping.compatible.length; j += 1) {
            bitset = this.compatible_category_map[code_point];
            const compatible_category = mapping.compatible[j];
            if (compatible_category == null) {
              continue;
            }
            const class_id = this.invoke_definition_map.lookup(compatible_category);  // Default Category
            if (class_id == null) {
              continue;
            }

            // eslint-disable-next-line no-bitwise
            const class_id_bit = 1 << class_id;

            // Set a bit of class ID 例えば、class_idが3のとき、3ビット目に1を立てる
            // eslint-disable-next-line no-bitwise, operator-assignment
            bitset = bitset | class_id_bit;
            this.compatible_category_map[code_point] = bitset;
          }
        }
      }
    }
    const default_id = this.invoke_definition_map.lookup(DEFAULT_CATEGORY);
    if (default_id == null) {
      return;
    }
    for (code_point = 0; code_point < this.character_category_map.length; code_point += 1) {
      // 他に何のクラスも定義されていなかったときだけ DEFAULT
      if (this.character_category_map[code_point] === 0) {
        // DEFAULT class ID に対応するビットだけ1を立てる
        // eslint-disable-next-line no-bitwise
        this.character_category_map[code_point] = 1 << default_id;
      }
    }
  }

  /**
   * Lookup compatible categories for a character (not included 1st category)
   * @param {string} ch UCS2 character (just 1st character is effective)
   * @returns {Array.<CharacterClass>} character classes
   */
  lookupCompatibleCategory(ch) {
    const classes = [];

    // if (SurrogateAwareString.isSurrogatePair(ch)) {
    //   // Surrogate pair character codes can not be defined by char.def
    //   return classes;
    // }

    const code = ch.charCodeAt(0);
    let integer;
    if (code < this.compatible_category_map.length) {
      // Bitset
      integer = this.compatible_category_map[code];
    }

    if (integer == null || integer === 0) {
      return classes;
    }

    for (let bit = 0; bit < 32; bit += 1) {
      // Treat "bit" as a class ID
      // eslint-disable-next-line no-bitwise
      if (((integer << (31 - bit)) >>> 31) === 1) {
        const character_class = this.invoke_definition_map.getCharacterClass(bit);
        if (character_class == null) {
          continue;
        }
        classes.push(character_class);
      }
    }
    return classes;
  }

  /**
   * Lookup category for a character
   * @param {string} ch UCS2 character (just 1st character is effective)
   * @returns {CharacterClass} character class
   */
  lookup(ch) {
    let class_id;
    const code = ch.charCodeAt(0);

    // when ch is UTF16, the length will be 2
    if (ch.length !== 1) {
      // Surrogate pair character codes can not be defined by char.def, so set DEFAULT category
      class_id = this.invoke_definition_map.lookup(DEFAULT_CATEGORY);
    } else if (code < this.character_category_map.length) {
      // Read as integer value
      class_id = this.character_category_map[code];
    }

    if (class_id == null) {
      class_id = this.invoke_definition_map.lookup(DEFAULT_CATEGORY);
    }

    return this.invoke_definition_map.getCharacterClass(class_id);
  }

  /**
   * Load CharacterDefinition
   * @param {Uint8Array} cat_map_buffer
   * @param {Uint32Array} compat_cat_map_buffer
   * @param {InvokeDefinitionMap} invoke_def_buffer
   * @returns {CharacterDefinition}
   */
  static load(cat_map_buffer, compat_cat_map_buffer, invoke_def_buffer) {
    const char_def = new CharacterDefinition();
    char_def.character_category_map = cat_map_buffer;
    char_def.compatible_category_map = compat_cat_map_buffer;
    char_def.invoke_definition_map = InvokeDefinitionMap.load(invoke_def_buffer);
    return char_def;
  }

  static parseCharCategory(class_id, parsed_category_def) {
    const category = parsed_category_def[1];
    const invoke = parseInt(parsed_category_def[2], 10);
    const grouping = parseInt(parsed_category_def[3], 10);
    const max_length = parseInt(parsed_category_def[4], 10);
    if (!Number.isFinite(invoke) || (invoke !== 0 && invoke !== 1)) {
      console.log('char.def parse error. INVOKE is 0 or 1 in:', invoke);
      return null;
    }
    if (!Number.isFinite(grouping) || (grouping !== 0 && grouping !== 1)) {
      console.log('char.def parse error. GROUP is 0 or 1 in:', grouping);
      return null;
    }
    if (!Number.isFinite(max_length) || max_length < 0) {
      console.log('char.def parse error. LENGTH is 1 to n:', max_length);
      return null;
    }
    const is_invoke = (invoke === 1);
    const is_grouping = (grouping === 1);

    return new CharacterClass(class_id, category, is_invoke, is_grouping, max_length);
  }

  static parseCategoryMapping(parsed_category_mapping) {
    // TODO the parsed_category_mapping is hex cannot parse int as dec
    const start = parseInt(parsed_category_mapping[1], 16);
    const default_category = parsed_category_mapping[2];
    const compatible_category = (parsed_category_mapping.length > 3)
      ? parsed_category_mapping.slice(3)
      : [];
    if (!Number.isFinite(start) || start < 0 || start > 0xFFFF) {
      console.log('char.def parse error. CODE is invalid:', start);
    }
    return {
      start,
      default: default_category,
      compatible: compatible_category,
    };
  }

  static parseRangeCategoryMapping(parsed_category_mapping) {
    // TODO the parsed_category_mapping is hex cannot parse int as dec
    const start = parseInt(parsed_category_mapping[1], 16);
    const end = parseInt(parsed_category_mapping[2], 16);
    const default_category = parsed_category_mapping[3];
    const compatible_category = (parsed_category_mapping.length > 4)
      ? parsed_category_mapping.slice(4)
      : [];
    if (!Number.isFinite(start) || start < 0 || start > 0xFFFF) {
      console.log('char.def parse error. CODE is invalid:', start);
    }
    if (!Number.isFinite(end) || end < 0 || end > 0xFFFF) {
      console.log('char.def parse error. CODE is invalid:', end);
    }
    return {
      start,
      end,
      default: default_category,
      compatible: compatible_category,
    };
  }
}


module.exports = CharacterDefinition;
