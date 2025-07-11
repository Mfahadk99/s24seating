export class UsefulUtils {
  static pad(num: number, size: number) {
    const s = '000000000' + num;
    return s.substr(s.length - size);
  }
}
