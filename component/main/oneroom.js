//! 지도 최대레벨일때 클러스터 전부다 보여주기 -> 어떻게 추려낼지 생각해서 만들어야돼
//! 지도레벨 줄어들때 검색범위 줄이면서 클러스터 범위 변경

class oneroom {
  SUBWAY_LIST_URL = "https://apis.zigbang.com/property/biglab/subway/all?";

  async getSubwayInfo(subwayName) {
    let response = await fetch(this.SUBWAY_LIST_URL);
    let data = await response.json();
    console.log(data);
    let subway = data.find((subway) => subway.name === subwayName);
    console.log(subway);
    return subway.id;
  }

  async getSubwayInfo_local(local) {
    let response = await fetch(this.SUBWAY_LIST_URL);
    let data = await response.json();
    let subway = data.filter((subway) => subway.local1 === local);
    console.log(subway);
    return data;
  }

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

  async getRoomInfo(roomId) {
    let response = await fetch(`https://apis.zigbang.com/v2/items/${roomId}`);
    let data = await response.json();
    return data;
  }

  async getOneRoomData(subway) {
    let subwayId = await getSubwayInfo(subway);

    let roomIdList = await getRoomIdList(subwayId);

    let roomInfo = [];
    roomIdList.forEach((roomId) => {
      roomInfo.push(getRoomInfo(roomId));
    });

    return roomInfo;
  }
}

let a = new oneroom();
a.getSubwayInfo_local("서울특별시");

// const SUBWAY_LIST_URL = "https://apis.zigbang.com/property/biglab/subway/all?";

// const 지하철역리스트 = [
//   "중곡역",
//   "군자역",
//   "어린이대공원역",
//   "건대입구역",
//   "뚝섬유원지역",
//   "구의역",
//   "강변역",
//   "광나루역",
//   "아차산역",
// ];
// // 매물 리스트에는 지도를 더 확대해 주세요를 적자

// // 원하는 역정보가 하나일때, 모든 역일때

// //! 방의 위도 경도 정보는 있으나 부정확해, 대략적인 위치를 알수있는 정도야
// //! 따라서 건물이름이나, 지도가 어느정도 확대되면 주소로 검색을 해서 찍어주고, 클러스터로 나오는 상태면 위도,경도로 사용
// /**
//  * 한개의 역 id를 찾는 함수
//  * @param {*} subwayName id를 찾고자하는 역 이름
//  * @returns 역 id
//  */
// async function getSubwayInfo(subwayName) {
//   let response = await fetch(SUBWAY_LIST_URL);
//   let data = await response.json();
//   let arr = data.map((subway) => subway.local1);
//   console.log(arr);
//   let nameArr = data.map((subway) => subway.name);
//   console.log(nameArr);
//   /**
//    * 서울특별시
//    * 경기도
//    * 강원도
//    * 충청남도
//    * 인천광역시
//    * 광주광역시
//    * 대구광역시
//    * 대전광역시
//    * 경상북도
//    * 경상남도
//    * 부산광역시
//    * 울산광역시
//    *
//    * null
//    */
//   let subway = data.find((subway) => subway.name === subwayName);
//   return subway.id;
// }

// /**
//  * 역 주변 원룸id를 찾는 함수
//  * @param {*} subwayId 원룸을 찾고자하는 역
//  * @returns 원룸 id 리스트
//  */
// async function getRoomIdList(subwayId) {
//   let response = await fetch(
//     `https://apis.zigbang.com/v3/items/ad/${subwayId}?subway_id=${subwayId}&radius=1&sales_type=&deposit_s=0&rent_s=0&floor=1~%7Crooftop%7Csemibase&domain=zigbang&detail=false`
//   );
//   let data = await response.json();

//   let roomIdList = data.list_items.map((room) => {
//     let roomInfo = room.simple_item || undefined;
//     if (roomInfo !== undefined) {
//       return roomInfo.item_id;
//     }
//   });

//   return roomIdList.filter((id) => id !== undefined);
// }

// /**
//  * id에 해당하는 원룸의 상세정보를 찾는 함수
//  * @param {*} roomId
//  * @returns 원룸의 상세정보
//  */
// async function getRoomInfo(roomId) {
//   let response = await fetch(`https://apis.zigbang.com/v2/items/${roomId}`);
//   let data = await response.json();
//   return data;
// }

// async function getRoomCoord(roomId) {
//   let response = await fetch(`https://apis.zigbang.com/v2/items/${roomId}`);
//   let data = await response.json();
//   return data;
// }

// /**
//  * 하나의 역 주변 원룸 모든매물의 상세정보를 찾는 함수
//  * @param {String} subway 찾을 역 이름
//  */
// async function getOneRoomData(subway) {
//   let subwayId = await getSubwayInfo(subway);

//   let roomIdList = await getRoomIdList(subwayId);

//   let roomInfo = [];
//   roomIdList.forEach((roomId) => {
//     roomInfo.push(getRoomInfo(roomId));
//   });

//   return roomInfo;
// }

// // getOneRoomData("아차산역");

// export { getOneRoomData };
