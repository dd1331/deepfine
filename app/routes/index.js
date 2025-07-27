var express = require("express");
var router = express.Router();
var indexController = require("../controllers/indexController");

/* GET home page. */
router.get("/", indexController.index);

// TMAP API 키 제공
router.get("/getScript", indexController.getScript);

// 엑셀 파일 업로드
router.post("/uploadExcel", indexController.uploadExcel);

// POI 데이터 조회
router.get("/api/poi", indexController.getPoiData);

// POI 검색
router.get("/api/search", indexController.searchPoi);

module.exports = router;
