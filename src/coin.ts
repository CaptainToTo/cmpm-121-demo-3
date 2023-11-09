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
}
