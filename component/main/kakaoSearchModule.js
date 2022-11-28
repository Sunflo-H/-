export default class kakaoSearch {
  constructor() {
    this.SEARCH_DATA_LENGTH = 15;
    this.RADIUS = {
      LV1: 5000,
      LV2: 10000,
      LV3: 15000,
      LV4: 20000,
    };
  }

  /**
   * 주소로검색, 키워드로검색 두 함수를 한번에 사용하여 검색하여 결과값을 반환하는 함수
   * @param {*} keyword 입력한 단어
   * @returns 두 검색방법으로 찾은 데이터
   */
  search(keyword, lat, lng) {
    let data = Promise.all([
      this.searchByAddr(keyword),
      this.searchByKeyword(keyword, lat, lng),
    ]).then((data) => data);
    return data;
  }

  /**
   * 주소로 검색하여 장소(주소)에 대한 정보를 반환하는 함수
   * @param {*} addr 검색할 주소 ex)구의동
   * @returns promise [주소데이터1, 주소데이터2 ...]
   */
  searchByAddr(addr) {
    let placeList = new Promise((resolve) => {
      // 주소-좌표 변환 객체를 생성합니다
      let geocoder = new kakao.maps.services.Geocoder();

      const callback = (result, status) => {
        resolve(result);
      };

      geocoder.addressSearch(addr, callback, { size: this.SEARCH_DATA_LENGTH });
    });
    return placeList;
  }

  /**
   * 키워드로 검색하여 장소(주소)에 대한 정보를 반환하는 함수
   * @param {*} keyword 검색할 키워드 ex)롯데리아
   * @param {*} lat
   * @param {*} lng
   * @returns promise [장소데이터1, 장소데이터2, ...]
   */
  searchByKeyword(keyword, lat, lng) {
    // const lat = map.getCenter()._lat;
    // const lng = map.getCenter()._lng;

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
        radius: this.RADIUS.LV4,
        size: this.SEARCH_DATA_LENGTH,
      };
      places.keywordSearch(keyword, getResult, option);
    });
    return placeList;
  }

  /**
   * 좌표로 행정동 주소 정보를 요청합니다. 동까지의 주소 정보를 얻는다.
   * @param {*} lat 위도 y
   * @param {*} lng 경도 x
   * @returns promise [{기본주소(서울 광진구 구의동)}, {상세주소(서울 광진구 구의2동)}]
   */
  searchAddrFromCoords(lat, lng) {
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
  searchDetailAddrFromCoords(lat, lng) {
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
  categorySearch(categoryCode, location, page, callback) {
    let places = new kakao.maps.services.Places();
    // 공공기관 코드 검색, 찾은 placeList는 callback으로 전달한다.
    places.categorySearch(categoryCode, callback, {
      location: location,
      page: page,
      radius: 500,
    });
  }
}
