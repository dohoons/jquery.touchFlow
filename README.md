﻿# jquery.touchFlow
- jQuery 기반의 수평or수직 터치스크롤 내비게이션 플러그인
- 마크업 요소 선택에 제약이 없으며 초보자도 쉽게 사용하도록 설계
- PC 브라우저에서 드래그로 사용가능 (기본 옵션으로 포함 v1.6.0)
- CSS Selector에 따라 다중 적용 가능
- jQuery 1.7+, IE9+ 지원

## Demo
http://dohoons.com/test/touchFlow

## 설치 방법

### \<script\> 태그 추가
``` html
<script src="jquery.touchFlow.js"></script>
```

### NPM

``` sh
$ npm i jquery.touchflow
```
``` js
var $ = require('jquery');
require('jquery.touchflow')($);
```

## 기본 사용법
``` css
.nav_h_type { background: #ccc; position: relative; overflow: hidden; }
.nav_h_type ul { float: left; display: block; font-size: 0; white-space: nowrap; position: relative; }
.nav_h_type li { box-sizing: border-box; display: inline-block; width: 100px; height: 100px; line-height: 100px; vertical-align: top; text-align: center; font-size: 12px; background: #eee; border: 1px solid #ccc; }
.nav_h_type li.on { background: #aaa; font-weight: bold; }
```

``` html
<div class="nav_h_type">
	<ul>
		<li>contents 1</li>
		<li>contents 2</li>
		<li>contents 3</li>
		<li>contents 4</li>
		<li>contents 5</li>
		<li class="on">contents 6</li>
		<li>contents 7</li>
		<li>contents 8</li>
		<li>contents 9</li>
		<li>contents 10</li>
	</ul>
</div>
```

``` js
$(".nav_h_list").touchFlow({
	axis : "x",
	page : "li.on"
});
```

## Options

| Option Name | Defaut | Description |
| --- | --- | --- |
| useMouse | true | 마우스 드래그 사용 |
| axis | 'x' | 드래그 방향 ('x','y') |
| page | 0 | 초기 페이지 (아이템 인덱스 숫자 or CSS 셀렉터 문자열) |
| speed | 200 | 애니메이션 속도 (ms) |
| snap | false | 스냅 기능 사용 |
| scrollbar | false | 스크롤바 표시 |
| scrollbarAutoHide | false | 스크롤바 자동숨김 |

## Method

| Name | Description |
| --- | --- |
| go_page(index) | index 페이지로 이동 |
| posX() | X 위치값 |
| posX(value) | X 위치값 변경 |
| posY() | Y 위치값 |
| posY(value) | Y 위치값 변경 |

## CallBack

| Name | Description |
| --- | --- |
| initComplete | 초기화 콜백 |
| stopped | 스크롤 정지 콜백 |
| resizeend | 윈도우 리사이즈 콜백 |