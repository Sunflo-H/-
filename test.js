// const readline = require("readline");
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });
// let input = [];
// rl.on("line", (line) => {
//   input = line.split(" ").map((val) => Number(val));
//   rl.close();
// });
// rl.on("close", () => {
//   console.log((input[0] + input[1]) % input[2]);
//   console.log(((input[0] % input[2]) + (input[1] % input[2])) % input[2]);
//   console.log((input[0] * input[1]) % input[2]);
//   console.log(((input[0] % input[2]) * (input[1] % input[2])) % input[2]);
//   process.exit();
// });

const rl = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

let input = [];

rl.on("line", (line) => {
  input.push(line);
});

rl.on("close", () => {
  const firstNum = input[0];
  const sceondNum = input[1];
  const sNum = input[1]
    .split("")
    .map((val) => Number(val))
    .reverse();
  sNum.forEach((num) => console.log(num * firstNum));
  console.log(Number(firstNum) * Number(sceondNum));

  process.exit();
});
