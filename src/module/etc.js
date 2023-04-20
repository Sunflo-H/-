/**
 * ^ 로딩바가 보이게 하는 함수
 * @param {*} boolean ture:보인다, false:사라진다.
 */
export function loading(boolean) {
  const loading = document.querySelector("#loading");
  if (boolean) loading.classList.add("active");
  else loading.classList.remove("active");
}

/**
 * ^ 평수를 구하는 함수
 * @param {*} size 전용면적
 * @returns 평수
 */
export function getPyeong(size) {
  return Math.floor(Math.round(Number(size)) / 3);
}
