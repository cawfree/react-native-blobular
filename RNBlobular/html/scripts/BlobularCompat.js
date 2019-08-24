class Blob {
  constructor(radius, x, y) {
    this.radius = radius;
    this.x = x;
    this.y = y;
  }
}

class BlobularCompat {
  constructor() {

  }
  putBlob(blob) {
    document
      .getElementsByTagName('svg')[0]
      .appendChild(this.lavaPath);
  }
}

window.addEventListener(
  'load',
  () => {
    const b = new BlobularCompat()
      .putBlob(
        new Blob(
          200,
          400,
          300,
        ),
      );
  },
);
