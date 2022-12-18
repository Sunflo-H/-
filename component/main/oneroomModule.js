//! 지도 최대레벨일때 클러스터 전부다 보여주기 -> 어떻게 추려낼지 생각해서 만들어야돼
//! 지도레벨 줄어들때 검색범위 줄이면서 클러스터 범위 변경

class Oneroom {
  SUBWAY_LIST_URL = "https://apis.zigbang.com/property/biglab/subway/all?";
  local = [
    "서울특별시",
    "경기도",
    "강원도",
    "충청남도",
    "인천광역시",
    "광주광역시",
    "대구광역시",
    "대전광역시",
    "경상북도",
    "경상남도",
    "부산광역시",
    "울산광역시",
    //"null"
  ];

  area = [
    "수도권",
    "광주",
    "대구",
    "대전",
    "부산",
    //"null"
  ];

  /**
   * 지하철역의 id 값을 리턴하는 함수
   * @param {*} subwayName 역이름 ex)"아차산역"
   * @returns 해당 역의 id값
   */
  async getSubwayId(subwayName) {
    let response = await fetch(this.SUBWAY_LIST_URL);
    let data = await response.json();
    let subway = data.find((subway) => subway.name === subwayName);
    return subway.id;
  }

  /**
   * 입력한 지역과 일치하는 지역의 지하철을 리턴하는 함수
   * @param {*} local 지역 이름
   * @returns 해당 지역의 지하철 목록
   */
  async getSubwayInfo_local(local) {
    let response = await fetch(this.SUBWAY_LIST_URL);
    let data = await response.json();
    let subwayList = data.filter((subway) => subway.local1 === local);
    return subwayList;
  }

  /**
   * 모든 지하철에 대한 정보를 리턴하는 함수
   * @returns 모든 지하철의 정보배열
   */
  async getSubwayInfo_all() {
    let response = await fetch(this.SUBWAY_LIST_URL);
    let subwayList = await response.json();

    return subwayList;
  }

  /**
   * 지하철역 주변의 매물들의 id 배열을 리턴하는 함수
   * @param {*} subwayId
   * @returns [id, id, id ...]
   */
  async getRoomIdList(subwayId) {
    let response = await fetch(
      `https://apis.zigbang.com/v3/items/ad/${subwayId}?subway_id=${subwayId}&radius=1&sales_type=&deposit_s=0&rent_s=0&floor=1~%7Crooftop%7Csemibase&domain=zigbang&detail=false`
    );
    let data = await response.json();

    let roomIdList = data.list_items.map((room) => {
      let roomInfo = room.simple_item || undefined;
      if (roomInfo !== undefined) {
        return roomInfo.item_id;
      }
    });
    return roomIdList.filter((id) => id !== undefined);
  }

  /**
   * 해당 id가 "원룸"일때 매물의 자세한 정보를 리턴하는 함수
   * @param {*} roomId
   * @returns 원룸이면 방정보, 원룸이 아니면 undefined
   */
  async getRoomInfo(roomId) {
    let response = await fetch(`https://apis.zigbang.com/v2/items/${roomId}`);
    let data = await response.json();
    let oneroom_code = ["01", "02", "03"]; // 분리형, 오픈형, 복층형

    if (oneroom_code.includes(data.item.room_type_code)) {
      return data;
    }
  }

  /**
   * 지하철역을 입력해서 역 주변 모든 매물들의 정보를 리턴한다.
   * @param {*} subway
   * @returns
   */
  async getRoomData(subway) {
    let subwayId = await this.getSubwayId(subway);

    let roomIdList = await this.getRoomIdList(subwayId);

    // for (let i = 0; i < roomIdList.length; i++) {
    //   let roomInfo = await this.getRoomInfo(roomIdList[i]);
    //   if (roomInfo) roomInfoList.push(roomInfo);
    // }

    // for문을 사용하면 프로미스를 하나씩 요청하고 응답받고, 다음꺼 요청하고 응답하고
    // 이런식으로 해서 배열수만큼 처리시간이 늘어난다.

    // forEach를 사용하면 프로미스를 한번에 요청하고, 순서대로 응답을 받는다.
    // 0~5 => 0번째 응답, 1응답, (이때 3,4,5까지 응답했는데 2는 아직이면 기다린다.)
    //        2응답되면 2받고 3,4,5 순서대로 받는다.

    // forEach 를 async로 만들면 모든 반복문들이 비동기가된다.
    // 0~5 => 5,0,2,3,1,4 이런식으로 처리 순서대로 응답한다.

    // id들로 모든 roomInfo를 가져온다. ★이때 Promise.all 이 중요!
    let roomInfoList = await Promise.all(
      roomIdList.map((roomId) => this.getRoomInfo(roomId))
    );

    // 방정보중 원룸인것들만 필터링
    let result = roomInfoList.filter((roomInfo) => roomInfo);
    // console.log(result);
    result.forEach((item) => {
      // console.log(item.item.movein_date);
    });

    return result;
  }
}

export default Oneroom;
