import urllib.parse

import google.generativeai as genai
import streamlit as st

# ---- 設定 ----------------------------------------------------------------
GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"
RAKUTEN_ID = "YOUR_RAKUTEN_ID"

SYSTEM_PROMPT = """あなたは「日本一ケチで賢い鉄道のプロ」です。
ユーザーの乗車区間を聞いて、必ず以下の3案を比較してください。

1. 🥇 最安案 — とにかく安く移動する方法
2. ⚡ 爆速案 — とにかく速く移動する方法
3. 💰 コスパ最強案 — 学割・分割購入などを活用した最もコスパの良い方法

【学割ルール】
JR区間が片道101km以上の場合は、必ず通常運賃から2割引きの学割運賃も提示してください。

回答は日本語で、具体的な金額・所要時間・乗り換え情報を含めてください。
"""
# -------------------------------------------------------------------------

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction=SYSTEM_PROMPT,
    tools=[{"google_search": {}}],
)


def extract_destination(text: str) -> str:
    """返答テキストから目的地っぽい地名を簡易抽出する。"""
    # 「〜駅」「〜市」「〜町」などが含まれていれば最初のものを返す
    import re
    match = re.search(r"[\u4e00-\u9fff\u30a0-\u30ff]+[駅市区町村]", text)
    return match.group(0) if match else ""


def build_rakuten_url(destination: str) -> str:
    encoded = urllib.parse.quote(destination, safe="")
    base = "https://hb.afl.rakuten.co.jp/hgc/{rakuten_id}/?pc=".format(
        rakuten_id=RAKUTEN_ID
    )
    search_url = (
        "https://search.travel.rakuten.co.jp/ds/vacant/searchSpot"
        f"?f_query={encoded}"
    )
    return base + urllib.parse.quote(search_url, safe="")


# ---- UI ------------------------------------------------------------------
st.title("🚄 鉄道節約・学割相談AI (2026年版)")

if "messages" not in st.session_state:
    st.session_state.messages = []
if "chat" not in st.session_state:
    st.session_state.chat = model.start_chat(history=[])

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("乗車区間や条件を入力してください（例：東京→大阪）"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.spinner("最新の運賃と時刻を調べています..."):
        response = st.session_state.chat.send_message(prompt)
        ai_text = response.text

    # 楽天アフィリエイトリンクを末尾に追加
    destination = extract_destination(ai_text)
    if destination:
        rakuten_url = build_rakuten_url(destination)
        ai_text += (
            f"\n\n---\n💡 **浮いたお金で、このホテルに泊まりませんか？**\n"
            f"[{destination}周辺のホテルを探す]({rakuten_url})"
        )

    st.session_state.messages.append({"role": "assistant", "content": ai_text})
    with st.chat_message("assistant"):
        st.markdown(ai_text)
