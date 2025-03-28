import re
import requests
import regex
def get_string(content, s1, s2):

    slice_2 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/"[0:s2]

    acc = 0
    for n, i in enumerate(content[::-1]):
        acc += int(i if i.isdigit() else 0) * s1**n

    k = ""
    while acc > 0:
        k = slice_2[int(acc % s2)] + k
        acc = (acc - (acc % s2)) / s2

    return k or "0"

def decrypt(full_string, key, v1, v2):
    v1, v2 = int(v1), int(v2)
    r = ""
    i = 0
    while i < len(full_string):
        s = ""
        while full_string[i] != key[v2]:
            s += full_string[i]
            i += 1
        j = 0
        while j < len(key):
            s = s.replace(key[j], str(j))
            j += 1
        r += chr(int(get_string(s, v2, 10)) - v1)
        i += 1
    return r

def get_ddg_cookies(url):
    r = requests.get('https://check.ddos-guard.net/check.js', headers = {'referer': url})
    r.raise_for_status()
    return r.cookies.get_dict()['__ddg2']
    
downloadPageLink = "https://kwik.si/f/oYIyVLuceHpw"
with requests.Session() as session:
    cookie = get_ddg_cookies(downloadPageLink)
    session.cookies.set(cookie,cookie,domain=downloadPageLink)
    downloadPage = session.get(downloadPageLink).text
    full_key, key, v1, v2 = re.search('\("(\w+)",\d+,"(\w+)",(\d+),(\d+),\d+\)',downloadPage).group(1,2,3,4)
    decrypted = decrypt(full_key,key,v1,v2)
    content = session.post(
        re.search('action="(.+?)"',decrypted).group(1),
        allow_redirects=False,
        data={"_token":re.search('value="(.+?)"',decrypted).group(1)},
        headers={"Referer": "https://kwik.cx/",},
        )
    print(content.headers["Location"])
cnt = 0
with requests.Session() as session:
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Cookie": "__ddg8_=BKYB2rLmEmuoKMoo; __ddg10_=1742777960"
    })
    for x in range(10):
        session.get("https://check.ddos-guard.net/set/id/RYSJJk0CDZARknGY")
        r = session.get("https://www.animepahe.ru/play/4d560dfd-e606-c21e-2eef-e48fd09f8188/09c6022c4e2c941b245b7e4322e6a6b1cb40af03ec9eee0e1890d60183746f84")
        print(r.text)
        if('Checking your browser before accessing <span class="ddg-origin"></span></h1><p id="ddg-l10n-description">Please wait a few seconds. Once this check is complete, the website will open automatically' in r.text):
            cnt = cnt + 1
print(cnt)
