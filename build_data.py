"""
カフェナビ 公開用データの生成スクリプト

入力 : 正本の index.html（claude.ai の開発用アーティファクト。非表示の店も含む）
出力 : out/stations.json … 1都3県の駅データ
       out/cafes.json    … 公開する店舗データ（非表示の店を除く。ODbLのダウンロード用と兼用）

公開サイトの index.html はデータを含まないので、店舗データを直しただけなら
この2ファイルを差し替えるだけで済みます。

使い方: python3 build_data.py 正本.html
"""
import json, sys, os, re

PREFS_KEEP = {11, 12, 13, 14}   # 埼玉・千葉・東京・神奈川
COLUMNS = ["name","station","walk_min","price_min","price_max","price_band","price_status",
           "drink","purposes","facilities","hours","type","chain","note","rules","lat","lng","link"]

src = sys.argv[1] if len(sys.argv) > 1 else "index.html"
lines = open(src, encoding="utf-8").read().split("\n")

def find_line(prefix):
    hits = [i for i, s in enumerate(lines) if s.lstrip().startswith(prefix)]
    if len(hits) != 1:
        sys.exit(f"「{prefix}」で始まる行が {len(hits)} 行あります（1行のはず）")
    return hits[0]

def parse_array(i):
    s = lines[i]
    return json.loads(s[s.index("=") + 1:].strip().rstrip(";"))

stations = [r for r in parse_array(find_line("var STATIONS_RAW")) if r[2] in PREFS_KEEP]
data = parse_array(find_line("var DATA="))
data_date = re.search(r'"([^"]+)"', lines[find_line("var DATA_DATE")]).group(1)

visible = [r for r in data if r[18] != 1]          # 19列目が1の店は非表示
labels = {s[0] for s in stations}
missing = sorted({r[1] for r in visible} - labels)
if missing:
    sys.exit("駅データに無い駅があります: " + "、".join(missing))

cafes_json = {
    "license": "ODbL 1.0 (https://opendatacommons.org/licenses/odbl/)",
    "attribution": "© OpenStreetMap contributors; additional data compiled by カフェナビ",
    "data_date": data_date,
    "columns": COLUMNS,
    "cafes": [dict(zip(COLUMNS, r[:18])) for r in visible],
}

os.makedirs("out", exist_ok=True)
json.dump(stations, open("out/stations.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
json.dump(cafes_json, open("out/cafes.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
n_chain = sum(1 for r in visible if r[11] == "c")
print(f"駅 {len(stations)} / 公開 {len(visible)}店（チェーン{n_chain}・個人店{len(visible)-n_chain}） / 非表示 {len(data)-len(visible)} / データ日 {data_date}")
