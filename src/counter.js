// TMAP API를 활용한 지도 시스템
class TmapMapSystem {
  constructor() {
    this.map = null;
    this.userMarker = null;
    this.poiMarkers = [];
    this.userLocation = null;
    this.isTracking = false;
    this.watchId = null;

    this.init();
  }

  async init() {
    console.log("TmapMapSystem 초기화 시작");

    try {
      // TMAP API가 로드될 때까지 대기
      await this.waitForTmapAPI();
      console.log("TMAP API 준비 완료");

      // 지도 초기화
      this.initMap();
      console.log("지도 초기화 완료");

      // 이벤트 리스너 설정
      this.setupEventListeners();
      console.log("이벤트 리스너 설정 완료");

      // 초기 POI 데이터 로드
      this.loadPoiData();
      console.log("POI 데이터 로드 완료");

      // 사용자 위치 추적 시작
      this.startLocationTracking();
      console.log("위치 추적 시작");
    } catch (error) {
      console.error("초기화 중 오류 발생:", error);
    }
  }

  waitForTmapAPI() {
    return new Promise((resolve, reject) => {
      if (window.Tmapv2) {
        resolve();
        return;
      }

      // TMAP API가 로드될 때까지 대기
      const checkInterval = setInterval(() => {
        if (window.Tmapv2) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // 10초 후 타임아웃
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error("TMAP API 로드 타임아웃"));
      }, 10000);
    });
  }

  initMap() {
    console.log("지도 초기화 시작");

    // 지도 초기화 (서울 시청 좌표)
    this.map = new Tmapv2.Map("map_div", {
      center: new Tmapv2.LatLng(37.5665, 126.978),
      width: "100%",
      height: "100%",
      zoom: 15,
      zoomControl: true, // 줌 컨트롤 활성화
      scrollwheel: true, // 마우스 휠 줌 활성화
      draggable: true, // 드래그 활성화
      keyboardShortcuts: true, // 키보드 단축키 활성화
    });

    console.log("지도 객체 생성 완료");

    // 사용자 마커 이미지 설정
    this.userMarker = new Tmapv2.Marker({
      position: new Tmapv2.LatLng(37.5665, 126.978),
      icon: "/images/pin-red.svg",
      iconSize: new Tmapv2.Size(24, 24),
      iconAnchor: new Tmapv2.Point(12, 24),
      map: this.map,
    });

    console.log("사용자 마커 생성 완료");
  }

  setupEventListeners() {
    // 검색 버튼 이벤트
    const searchButton = document.querySelector('button[aria-label="refresh"]');
    if (searchButton) {
      searchButton.addEventListener("click", () => {
        console.log("refresh 버튼 클릭");
        this.loadPoiData();
      });
    }

    // import 버튼 이벤트
    const importButton = document.querySelector('button[aria-label="import"]');
    if (importButton) {
      importButton.addEventListener("click", () => {
        console.log("import 버튼 클릭");
        this.showFileUploadDialog();
      });
    }

    // 검색 입력 이벤트
    const searchInput = document.querySelector('input[type="search"]');
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.handleSearch(e.target.value);
      });
    }

    // 키보드 단축키 이벤트
    document.addEventListener("keydown", (e) => {
      if (e.key === "+" || e.key === "=") {
        this.map.zoomIn();
      } else if (e.key === "-") {
        this.map.zoomOut();
      }
    });
  }

  showFileUploadDialog() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        this.uploadExcelFile(file);
      }
    };
    input.click();
  }

  async uploadExcelFile(file) {
    const formData = new FormData();
    formData.append("excelFile", file);

    try {
      const response = await fetch("/uploadExcel", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        this.loadPoiData(); // 업로드 후 데이터 새로고침
      } else {
        alert("업로드 실패: " + result.error);
      }
    } catch (error) {
      alert("업로드 중 오류가 발생했습니다: " + error.message);
    }
  }

  async loadPoiData() {
    try {
      const response = await fetch("/api/poi");
      const result = await response.json();

      if (result.success) {
        this.clearPoiMarkers();
        this.addPoiMarkers(result.data);
        console.log(`${result.data.length}개의 POI 마커 추가됨`);
      }
    } catch (error) {
      console.error("POI 데이터 로드 실패:", error);
    }
  }

  clearPoiMarkers() {
    this.poiMarkers.forEach((marker) => {
      marker.setMap(null);
    });
    this.poiMarkers = [];
  }

  addPoiMarkers(poiData) {
    poiData.forEach((poi) => {
      const marker = new Tmapv2.Marker({
        position: new Tmapv2.LatLng(poi.poi_lat, poi.poi_lng),
        icon: "/images/pin-location.svg",
        iconSize: new Tmapv2.Size(24, 24),
        iconAnchor: new Tmapv2.Point(12, 24),
        map: this.map,
      });

      // 마커 클릭 이벤트
      marker.addListener("click", () => {
        this.showPoiInfo(poi);
        this.centerMapOnPoi(poi);
      });

      this.poiMarkers.push(marker);
    });
  }

  showPoiInfo(poi) {
    // POI 정보를 표시하는 팝업 또는 알림
    const info = `
            <div style="padding: 10px;">
                <h3>${poi.poi_name}</h3>
                <p>주소: ${poi.poi_address}</p>
                <p>좌표: ${poi.poi_lat}, ${poi.poi_lng}</p>
            </div>
        `;

    // 간단한 알림으로 표시 (실제로는 더 세련된 UI를 사용할 수 있음)
    alert(`POI 정보:\n${poi.poi_name}\n주소: ${poi.poi_address}`);
  }

  centerMapOnPoi(poi) {
    const position = new Tmapv2.LatLng(poi.poi_lat, poi.poi_lng);
    this.map.panTo(position);
  }

  async handleSearch(searchTerm) {
    if (!searchTerm.trim()) {
      this.loadPoiData();
      return;
    }

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchTerm)}`
      );
      const result = await response.json();

      if (result.success) {
        this.clearPoiMarkers();
        this.addPoiMarkers(result.data);

        // 검색 결과가 있으면 첫 번째 결과로 지도 중심 이동
        if (result.data.length > 0) {
          this.centerMapOnPoi(result.data[0]);
        }
      }
    } catch (error) {
      console.error("검색 실패:", error);
    }
  }

  startLocationTracking() {
    if (navigator.geolocation) {
      this.isTracking = true;
      console.log("위치 추적 시작");

      // 초기 위치 가져오기
      navigator.geolocation.getCurrentPosition(
        (position) => this.updateUserLocation(position),
        (error) => console.error("위치 가져오기 실패:", error),
        { enableHighAccuracy: true }
      );

      // 위치 변화 감지
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.updateUserLocation(position),
        (error) => console.error("위치 추적 실패:", error),
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
      );
    } else {
      console.error("Geolocation이 지원되지 않습니다.");
    }
  }

  updateUserLocation(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    this.userLocation = { lat, lng };

    // 사용자 마커 위치 업데이트
    const newPosition = new Tmapv2.LatLng(lat, lng);
    this.userMarker.setPosition(newPosition);

    // 첫 번째 위치 업데이트 시 지도 중심 이동
    if (!this.isTracking) {
      this.map.panTo(newPosition);
      this.isTracking = true;
    }
  }

  stopLocationTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
  }
}

// 페이지 로드 시 지도 시스템 초기화
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM 로드 완료, TmapMapSystem 초기화 시작");
  new TmapMapSystem();
});
