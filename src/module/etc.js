/**
 * ^ 로딩바가 보이게 하는 함수
 * @param {*} boolean ture:보인다, false:사라진다.
 */
function loading(boolean) {
  const loading = document.querySelector("#loading");
  if (boolean) loading.classList.add("active");
  else loading.classList.remove("active");
}

export default { loading };
