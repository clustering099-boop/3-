
// 경기도 주요 시의 격자 좌표 정의
const cityCoordinates = {
    ansan: { nx: 58, ny: 121, name: "안산시" },
    suwon: { nx: 60, ny: 121, name: "수원시" },
    seongnam: { nx: 63, ny: 124, name: "성남시" },
    goyang: { nx: 57, ny: 128, name: "고양시" },
    yongin: { nx: 64, ny: 119, name: "용인시" },
    bucheon: { nx: 57, ny: 125, name: "부천시" },
    anyang: { nx: 59, ny: 123, name: "안양시" },
    pyeongtaek: { nx: 62, ny: 114, name: "평택시" }
};

// API 설정
const API_KEY = "7845a027a80c4ea9b816545402314fb5c846a9c31dbf12a874fb79838bd618d7";
const BASE_URL = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst";

// DOM 요소
const citySelect = document.getElementById('citySelect');
const getWeatherBtn = document.getElementById('getWeatherBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const weatherCard = document.getElementById('weatherCard');
const errorMessage = document.getElementById('errorMessage');

// 날씨 아이콘 매핑
const weatherIcons = {
    "맑음": "☀️",
    "구름많음": "⛅",
    "흐림": "☁️",
    "비": "🌧️",
    "눈": "❄️",
    "소나기": "🌦️"
};

// 현재 시간 포맷팅
function getCurrentTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return {
        date: `${year}${month}${day}`,
        time: `${hours}${minutes}`,
        display: `${year}.${month}.${day} ${hours}:${minutes}`
    };
}

// API 호출 함수
async function fetchWeatherData(cityKey) {
    const coord = cityCoordinates[cityKey];
    const currentTime = getCurrentTime();
    
    const params = new URLSearchParams({
        serviceKey: API_KEY,
        pageNo: 1,
        numOfRows: 1000,
        dataType: 'JSON',
        base_date: currentTime.date,
        base_time: currentTime.time,
        nx: coord.nx,
        ny: coord.ny
    });

    try {
        const response = await fetch(`${BASE_URL}?${params}`);
        const data = await response.json();
        
        if (data.response.header.resultCode === '00') {
            return data.response.body.items.item;
        } else {
            throw new Error('API 응답 오류');
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        throw error;
    }
}

// 날씨 데이터 파싱
function parseWeatherData(items) {
    const weatherData = {};
    
    items.forEach(item => {
        switch(item.category) {
            case 'T1H': // 기온
                weatherData.temperature = Math.round(parseFloat(item.obsrValue));
                break;
            case 'REH': // 상대습도
                weatherData.humidity = item.obsrValue;
                break;
            case 'WSD': // 풍속
                weatherData.windSpeed = parseFloat(item.obsrValue).toFixed(1);
                break;
            case 'RN1': // 1시간 강수량
                weatherData.precipitation = item.obsrValue;
                break;
            case 'PTY': // 강수형태
                weatherData.precipitationType = item.obsrValue;
                break;
        }
    });

    // 날씨 상태 결정
    weatherData.condition = getWeatherCondition(weatherData.precipitationType, weatherData.temperature);
    weatherData.icon = weatherIcons[weatherData.condition] || "🌤️";
    
    return weatherData;
}

// 날씨 상태 결정 함수
function getWeatherCondition(precipitationType, temperature) {
    switch(precipitationType) {
        case '1': return '비';
        case '2': return '비';
        case '3': return '눈';
        case '4': return '소나기';
        default:
            if (temperature >= 25) return '맑음';
            else if (temperature >= 15) return '구름많음';
            else return '흐림';
    }
}

// 배경 이미지 변경 함수
function updateBackgroundByWeather(condition) {
    // 기존 날씨 클래스 제거
    document.body.classList.remove('sunny', 'cloudy', 'rainy', 'snowy', 'shower');
    
    // 날씨 조건에 따른 배경 클래스 추가
    switch(condition) {
        case '맑음':
            document.body.classList.add('sunny');
            break;
        case '구름많음':
            document.body.classList.add('cloudy');
            break;
        case '흐림':
            document.body.classList.add('cloudy');
            break;
        case '비':
            document.body.classList.add('rainy');
            break;
        case '눈':
            document.body.classList.add('snowy');
            break;
        case '소나기':
            document.body.classList.add('shower');
            break;
        default:
            // 기본 배경 유지
            break;
    }
}

// UI 업데이트 함수
function updateWeatherUI(weatherData, cityName) {
    const currentTime = getCurrentTime();
    
    document.getElementById('cityName').textContent = cityName;
    document.getElementById('currentTime').textContent = currentTime.display;
    document.getElementById('temperature').textContent = weatherData.temperature || '--';
    document.getElementById('weatherIcon').textContent = weatherData.icon;
    document.getElementById('weatherCondition').textContent = weatherData.condition || '--';
    document.getElementById('humidity').textContent = `${weatherData.humidity || '--'}%`;
    document.getElementById('precipitation').textContent = `${weatherData.precipitation || 0}mm`;
    document.getElementById('windSpeed').textContent = `${weatherData.windSpeed || '--'}m/s`;
    document.getElementById('pressure').textContent = '1013hPa'; // 기압은 고정값 (API에서 제공하지 않음)
    
    // 날씨에 맞는 배경 이미지 적용
    updateBackgroundByWeather(weatherData.condition);
}

// 로딩 상태 관리
function showLoading() {
    loadingSpinner.classList.remove('hidden');
    weatherCard.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

function showError() {
    errorMessage.classList.remove('hidden');
    weatherCard.classList.add('hidden');
}

function showWeatherCard() {
    weatherCard.classList.remove('hidden');
    errorMessage.classList.add('hidden');
}

// 메인 날씨 조회 함수
async function getWeather() {
    const selectedCity = citySelect.value;
    
    if (!selectedCity) {
        alert('도시를 선택해주세요.');
        return;
    }

    showLoading();

    try {
        const weatherItems = await fetchWeatherData(selectedCity);
        const weatherData = parseWeatherData(weatherItems);
        const cityName = cityCoordinates[selectedCity].name;
        
        updateWeatherUI(weatherData, cityName);
        showWeatherCard();
    } catch (error) {
        console.error('날씨 정보 조회 실패:', error);
        showError();
    } finally {
        hideLoading();
    }
}

// 이벤트 리스너
getWeatherBtn.addEventListener('click', getWeather);

citySelect.addEventListener('change', function() {
    if (this.value) {
        getWeatherBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
});

// 엔터키로 검색
citySelect.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && this.value) {
        getWeather();
    }
});

// 페이지 로드 시 현재 시간 표시
document.addEventListener('DOMContentLoaded', function() {
    console.log('경기도 날씨 앱이 로드되었습니다.');
});
