/*
 * Homography calculation from 4 source and 4 destination points
 * Adapted from https://github.com/move-on/perspective-transform
 * and https://gist.github.com/marklundin/658176
 */
window.Homography = (function() {

  function getTransform(src, dst) {
    var r = getMatrix(src, dst);
    return "matrix3d(" +
      r[0][0].toFixed(9) + "," + r[1][0].toFixed(9) + ", 0," + r[2][0].toFixed(9) + "," +
      r[0][1].toFixed(9) + "," + r[1][1].toFixed(9) + ", 0," + r[2][1].toFixed(9) + "," +
      "0, 0, 1, 0," +
      r[0][2].toFixed(9) + "," + r[1][2].toFixed(9) + ", 0," + r[2][2].toFixed(9) +
    ")";
  }

  function getMatrix(src, dst) {
    var A = [], b = [], i;
    for (i = 0; i < 4; i++) {
      A.push([src[i].x, src[i].y, 1, 0, 0, 0, -src[i].x * dst[i].x, -src[i].y * dst[i].x]);
      A.push([0, 0, 0, src[i].x, src[i].y, 1, -src[i].x * dst[i].y, -src[i].y * dst[i].y]);
      b.push(dst[i].x);
      b.push(dst[i].y);
    }

    var h = solve(A, b);

    return [
      [h[0], h[3], h[6]],
      [h[1], h[4], h[7]],
      [h[2], h[5], 1]
    ];
  }

  // Gaussian elimination
  function solve(A, b) {
    var n = A.length;
    for (var i = 0; i < n; i++) {
      var maxEl = Math.abs(A[i][i]), maxRow = i;
      for (var k = i + 1; k < n; k++) {
        if (Math.abs(A[k][i]) > maxEl) {
          maxEl = Math.abs(A[k][i]);
          maxRow = k;
        }
      }

      for (var k = i; k < n; k++) {
        var tmp = A[maxRow][k];
        A[maxRow][k] = A[i][k];
        A[i][k] = tmp;
      }
      var tmp = b[maxRow];
      b[maxRow] = b[i];
      b[i] = tmp;

      for (k = i + 1; k < n; k++) {
        var c = -A[k][i] / A[i][i];
        for (var j = i; j < n; j++) {
          if (i === j) {
            A[k][j] = 0;
          } else {
            A[k][j] += c * A[i][j];
          }
        }
        b[k] += c * b[i];
      }
    }

    var x = new Array(n);
    for (i = n - 1; i > -1; i--) {
      x[i] = b[i] / A[i][i];
      for (k = i - 1; k > -1; k--) {
        b[k] -= A[k][i] * x[i];
      }
    }
    return x;
  }

  return {
    getTransform: getTransform
  };

})();
