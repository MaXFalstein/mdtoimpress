<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=1024" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <title>{{$title}}</title>
    <style type="text/css">{{$css}}</style>
    <style type="text/css">{{$themecss}}</style>
</head>
<body>
    <div id="impress" data-transition-duration=200>{{$html}}</div>
    <script>{{$js}}</script>
    <script>{{$themejs}}</script>
    <script>impress().init();</script>
</body>
