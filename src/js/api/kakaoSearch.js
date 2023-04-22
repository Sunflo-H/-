const SEARCH_DATA_LENGTH = 15;
const RADIUS = {
  LV1: 5000,
  LV2: 10000,
  LV3: 15000,
  LV4: 20000,
  hyperLocal: 1500,
};

/**
 * 주소로검색, 키워드로검색 두 함수를 한번에 사용하여 검색하여 결과값을 반환하는 함수
 * @param {*} keyword 입력한 단어
 * @returns 두 검색방법으로 찾은 데이터
 */
function search(keyword, lat, lng) {
  let data = Promise.all([
    searchByAddr(keyword),
    searchByKeyword(keyword, lat, lng),
  ]).then((data) => data);
  return data;
}

/**
 * 주소로검색, 키워드(자동완성)로검색 두 함수를 한번에 사용하여 검색하여 결과값을 반환하는 함수
 * @param {*} keyword 입력한 단어
 * @returns 두 검색방법으로 찾은 데이터
 */
function search_autoComplete(keyword) {
  let data = Promise.all([searchByAddr(keyword), autoComplete(keyword)]).then(
    (data) => data
  );
  return data;
}

function search_hyperLocal(keyword, lat, lng) {
  let data = searchByKeyword_hyperLocal(keyword, lat, lng).then((data) => data);
  return data;
}

/**
 * 주소로 검색하여 장소(주소)에 대한 정보를 반환하는 함수
 * @param {*} addr 검색할 주소 ex)구의동
 * @returns promise [주소데이터1, 주소데이터2 ...]
 */
function searchByAddr(addr) {
  let placeList = new Promise((resolve) => {
    // 주소-좌표 변환 객체를 생성합니다
    let geocoder = new kakao.maps.services.Geocoder();

    const callback = (result, status) => {
      resolve(result);
    };

    geocoder.addressSearch(addr, callback, { size: SEARCH_DATA_LENGTH });
  });
  return placeList;
}

/**
 * 키워드로 검색하여 주변(lat,lng)의 장소(주소)에 대한 정보를 반환하는 함수
 * @param {*} keyword 검색할 키워드 ex)롯데리아
 * @param {*} lat
 * @param {*} lng
 * @returns promise [장소데이터1, 장소데이터2, ...]
 */
function searchByKeyword(keyword, lat, lng) {
  let placeList = new Promise((resolve, reject) => {
    let places = new kakao.maps.services.Places();

    const getResult = (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        resolve(result);
      }
    };
    let option = {
      x: lng,
      y: lat,
      radius: RADIUS.LV4,
      size: SEARCH_DATA_LENGTH,
    };
    places.keywordSearch(keyword, getResult, option);
  });
  return placeList;
}

/**
 * 자동완성용 키워드 검색, page를 입력받는다.
 * @param {*} keyword
 * @param {*} page
 * @returns [promise] promise는 키워드와 일치하는 검색결과들
 */
function searchByKeyword_autoComplete(keyword, page) {
  return new Promise((resolve, reject) => {
    let places = new kakao.maps.services.Places();

    const getResult = (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        let a = [];
        result.forEach((item) => {
          if (keyword == item.place_name.slice(0, keyword.length)) {
            a.push(item.place_name);
          }
        });

        resolve(a);
      }
    };

    let option = {
      size: SEARCH_DATA_LENGTH,
      page: page,
    };
    places.keywordSearch(keyword, getResult, option);
  });
}

/**
 * searchByKeyword와 같은 기능을 하나 검색 반경을 1km로 제한
 * @param {*} keyword 검색할 키워드 ex)롯데리아
 * @param {*} lat
 * @param {*} lng
 * @returns promise [장소데이터1, 장소데이터2, ...]
 */
function searchByKeyword_hyperLocal(keyword, lat, lng) {
  let placeList = new Promise((resolve, reject) => {
    let places = new kakao.maps.services.Places();

    const getResult = (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        resolve(result);
      }
    };

    let option = {
      x: lng,
      y: lat,
      // radius: RADIUS.hyperLocal,
      // location: new kakao.maps.LatLng(lat, lng),
      radius: 1000,
      size: SEARCH_DATA_LENGTH,
    };
    places.keywordSearch(keyword, getResult, option);
  });
  return placeList;
}

/**
 * 키워드로 검색을 하되, 키워드와 글자가 일치하는 값들을 우선적으로 리턴한다.
 * @param {*} keyword 검색할 키워드 ex)롯데리아
 * @param {*} lat
 * @param {*} lng
 * @returns promise [장소데이터1, 장소데이터2, ...]
 */
async function autoComplete(keyword) {
  const promiseArr = [];
  for (let i = 0; i < 10; i++) {
    promiseArr.push(searchByKeyword_autoComplete(keyword, i + 1));
  }

  const data = await Promise.all(promiseArr);
  let result = new Set();
  data.forEach((item) => {
    item.forEach((item_1) => {
      if (result.size >= 10) return;
      result.add(item_1);
    });
  });
  return (result = [...result]);
}

/**
 * 좌표로 행정동 주소 정보를 요청합니다. 동까지의 주소 정보를 얻는다.
 * @param {*} lat 위도 y
 * @param {*} lng 경도 x
 * @returns promise [{기본주소(서울 광진구 구의동)}, {상세주소(서울 광진구 구의2동)}]
 */
function searchAddrFromCoords(lat, lng) {
  let addr = new Promise((resolve, reject) => {
    var geocoder = new kakao.maps.services.Geocoder();

    const getResult = (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        resolve(result);
      }
    };

    geocoder.coord2RegionCode(lng, lat, getResult);
  });

  return addr;
}

/**
 * 좌표로 법정동 상세 주소 정보를 요청합니다
 * @param {*} lat 위도 y
 * @param {*} lng 경도 x
 * @returns promise [{지번주소, 도로명주소}]
 */
function searchDetailAddrFromCoords(lat, lng) {
  let detailAddr = new Promise((resolve, reject) => {
    var geocoder = new kakao.maps.services.Geocoder();

    const getResult = (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        resolve(result);
      }
    };

    geocoder.coord2Address(lng, lat, getResult);
  });

  return detailAddr;
}

/**
     * 현재 위치에서 카테고리 검색을 하고 callback함수에 결과값을 주는 함수
     * @param {string} categoryCode 
        MT1	대형마트
        CS2	편의점
        PS3	어린이집, 유치원
        SC4	학교
        AC5	학원
        PK6	주차장
        OL7	주유소, 충전소
        SW8	지하철역
        BK9	은행
        CT1	문화시설
        AG2	중개업소
        PO3	공공기관
        AT4	관광명소
        AD5	숙박
        FD6	음식점
        CE7	카페
        HP8	병원
        PM9	약국
     * @param {LatLng} location 위도
     * @param {number} page 검색 결과의 page
     * @param {function} callback 카테고리 검색 결과를 받을 콜백 함수
     */
function categorySearch(categoryCode, location, page, callback) {
  let places = new kakao.maps.services.Places();
  // 공공기관 코드 검색, 찾은 placeList는 callback으로 전달한다.
  places.categorySearch(categoryCode, callback, {
    location: location,
    page: page,
    radius: 500,
  });
}

export default { search, search_autoComplete, search_hyperLocal };
