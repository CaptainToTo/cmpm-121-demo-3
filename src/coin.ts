export class GeoCoin {
  i: number;
  j: number;
  id: number;

  constructor(i: number, j: number, id: number) {
    this.i = i;
    this.j = j;
    this.id = id;
  }

  toString(): string {
    return `${this.i}:${this.j}#${this.id}`;
  }

  static parseString(str: string): GeoCoin {
    const tokens = str.split("#");
    const coords = tokens[0].split(":");
    return new GeoCoin(
      parseInt(coords[0]),
      parseInt(coords[1]),
      parseInt(tokens[1])
    );
  }
}
