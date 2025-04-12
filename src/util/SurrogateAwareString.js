class SurrogateAwareString {
  constructor(str) {
    this.str = str;
    this.array = [...str];
    this.length = this.array.length;
  }

  slice(index) {
    return this.array.slice(index).join('');
  }

  charAt(index) {
    if (index >= this.array.length) {
      return '';
    }
    return this.array[index];
  }

  // return the char code by the index
  // when the target char is an UTF16 char, only returns the first 16 bits
  charCodeAt(index) {
    return this.charAt(index).charCodeAt(0);
  }

  toString() {
    return this.str;
  }
}

module.exports = SurrogateAwareString;
