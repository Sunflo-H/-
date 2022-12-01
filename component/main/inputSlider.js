const inputLeft = document.getElementById("input-left");
const inputRight = document.getElementById("input-right");

const thumbLeft = document.querySelector(".slider__thumb--left");
const thumbRight = document.querySelector(".slider__thumb--right");

const range = document.querySelector(".slider__range");

const setLeftValue = (e) => {
  const _this = e.target;
  const { value, min, max } = _this;

  if (inputRight.value - value < 10) {
    _this.value = inputRight.value - 10;
  }

  const percent = ((_this.value - min) / (max - min)) * 100;
  console.log("왼쪽", Math.round(percent));
  thumbLeft.style.left = `${percent * 0.9}%`;
  range.style.left = `${percent * 0.9}%`;
};

const setRightValue = (e) => {
  const _this = e.target;
  const { value, min, max } = _this;

  if (value - inputLeft.value < 10) {
    _this.value = inputLeft.value + 10;
  }

  const percent = ((_this.value - min) / (max - min)) * 100;
  console.log("오른쪽", percent);
  thumbRight.style.right = `${(100 - percent) * 0.9}%`;
  range.style.right = `${(100 - percent) * 0.9}%`;
};

if (inputLeft && inputRight) {
  inputLeft.addEventListener("input", setLeftValue);
  inputRight.addEventListener("input", setRightValue);
}

inputLeft.addEventListener("change", (e) => {
  console.log(e.target.vlaue);
});
