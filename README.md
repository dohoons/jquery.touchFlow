# jquery.touchFlow
- jQuery 기반의 수평or수직 터치스크롤 내비게이션 플러그인
- 마크업 요소 선택에 제약이 없으며 초보자도 쉽게 사용하도록 설계
- PC 브라우저에서 드래그로 사용가능 (jquery.event.drag 로드시)
- CSS Selector에 따라 다중 적용 가능

## 기본구조
``` css
.nav_h_type { background:#ccc; position:relative; overflow:hidden; }
.nav_h_type ul { float:left; display:block; font-size:0; white-space:nowrap; position:relative; }
.nav_h_type li { -webkit-box-sizing:border-box; box-sizing:border-box; display:inline-block; width:100px; height:100px; line-height:100px; vertical-align:top; text-align:center; font-size:12px; background:#eee; border:1px solid #ccc; }
.nav_h_type li.on { background:#aaa; font-weight:bold; }
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

##Demo
http://dohoons.com/test/touchFlow
