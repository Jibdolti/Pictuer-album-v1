import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyDuUlUyAQ5i89DIHqkyok61oyokqCQY_pA",
    authDomain: "family-album-b6cb0.firebaseapp.com",
    projectId: "family-album-b6cb0",
    storageBucket: "family-album-b6cb0.firebasestorage.app",
    messagingSenderId: "164879633107",
    appId: "1:164879633107:web:0b144b245ea005a882a226"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

var EMO = [
    "👨‍👩‍👧",
    "🎂",
    "✈️",
    "🌸",
    "🏠",
    "🎄"
];
var S = {
    albums: [
        {
            id: "a1",
            n: "가족여행",
            e: "✈️"
        }, {
            id: "a2",
            n: "생일",
            e: "🎂"
        }, {
            id: "a3",
            n: "명절",
            e: "🏮"
        }, {
            id: "a4",
            n: "아이들",
            e: "👶"
        }
    ],
    photos: [],
    trash: [],
    years: []
};
var tab = "alb",
    cur = null,
    emo = EMO[0],
    vlist = [],
    vi = 0,
    $ = function (i) {
        return document.getElementById(i)
    };
function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
        return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]
    })
}
async function save() {
    try {
        await setDoc(doc(db, "familyAlbum", "config"), {
            albums: S.albums,
            trash: S.trash || [],
            years: S.years || []
        });
    } catch (e) {
        console.error("저장 실패:", e);
    }
}
async function load(cb) {
    try {
        var configDoc = await getDoc(doc(db, "familyAlbum", "config"));
        if (configDoc.exists()) {
            var data = configDoc.data();
            if (data.albums) S.albums = data.albums;
            if (data.trash) S.trash = data.trash;
            if (data.years) S.years = data.years;
        } else {
            await save();
        }

        var photosSnapshot = await getDocs(collection(db, "photos"));
        S.photos = [];
        photosSnapshot.forEach(function (docSnap) {
            S.photos.push(docSnap.data());
        });
        cb();
    } catch (e) {
        console.error("불러오기 실패:", e);
        cb();
    }
}
function ph(a) {
    return S
        .photos
        .filter(function (p) {
            return !a || p.a === a
        })
        .sort(function (x, y) {
            return y.t - x.t
        })
}
function grid(list) {
    if (mode === "y") 
        return ygrid(list);
    var h = list
        .map(function (p, i) {
            return '<div data-i="' + i + '"><img src="' + p.d + '">' + (
                p.v
                    ? '<span class="pl">▶</span>'
                    : ''
            ) + '</div>'
        })
        .join("");
    h += '<div class="ad" data-add="1">＋<span>사진 추가</span></div>';
    return '<div class="sw">' + h + '</div><div class="cn" id="cn">' + (
        list.length
            ? '1 / ' + list.length
            : '아직 사진이 없어요'
    ) + '</div>'
}
function render0() {
    var m = $("main"),
        b = $("back"),
        t = $("ttl");
    m.style.scrollSnapType = cur
        ? "y proximity"
        : "";
    $("top").style.display = (cur || curY || curT || curU)
        ? "flex"
        : "none";
    document
        .querySelectorAll("#tabs button")
        .forEach(function (x) {
            x
                .classList
                .toggle("on", x.dataset.t === tab)
        });
    if (curU === "fav") {
        b.textContent = "‹ 앨범";
        t.textContent = "즐겨찾기";
        t.style.opacity = 1;
        vlist = ph().filter(function (p) {
            return p.f
        });
        m.innerHTML = favView();
        return
    }
    if (curU === "vid") {
        b.textContent = "‹ 앨범";
        t.textContent = "동영상";
        t.style.opacity = 1;
        vlist = ph().filter(function (p) {
            return p.v
        });
        m.innerHTML = vidView();
        return
    }
    if (curT) {
        b.textContent = "‹ 앨범";
        t.textContent = "휴지통";
        t.style.opacity = 1;
        m.innerHTML = trashView();
        return
    }
    if (curY) {
        b.textContent = "‹ 앨범";
        t.textContent = curY + "년";
        t.style.opacity = 1;
        vlist = py(curY);
        m.innerHTML = ylib(curY);
        return
    }
    if (cur) {
        var a = S
            .albums
            .filter(function (x) {
                return x.id === cur
            })[0];
        b.textContent = "‹ 앨범";
        t.textContent = a.n;
        t.style.opacity = 1;
        vlist = ph(cur);
        m.innerHTML = '<h1>' + esc(a.n) + '<button class="hp" data-sel="1">선택</button></h1>' + vgrid(vlist) + '<div class="dl"><button data-del="1">앨범 삭제</button></div>';
        return
    }
    b.textContent = "";
    if (tab === "alb") {
        t.style.opacity = 0;
        vlist = ph();
        m.innerHTML = home();
        return
    }
    if (tab === "lib") {
        t.style.opacity = 0;
        vlist = ph();
        var n = vlist.length;
        m.innerHTML = lib() + (
            n
                ? '<div class="empty" style="padding:8px">사진 ' + n + '장</div>'
                : ''
        );
        return
    }
    t.style.opacity = 0;
    m.innerHTML = '<h1>앨범</h1><div class="albums">' + S
        .albums
        .map(function (a) {
            var l = ph(a.id);
            return '<div class="al" data-a="' + a.id + '"><div class="cv">' + (
                l[0]
                    ? '<img src="' + l[0].d + '">'
                    : a.e
            ) + '</div><div class="an">' + esc(a.n) + '</div><div class="ac">' + l.length +
                    '</div></div>'
        })
        .join("") + '<div class="al" data-new="1"><div class="cv" style="color:var(--blue);font-size:40px">＋</div><div class="an" style="color:var(--blue)">새로운 앨범</div></div></div>'
}
$("main").addEventListener("click", function (e) {
    var el = e
        .target
        .closest(
            "[data-a],[data-new],[data-i],[data-add],[data-m],[data-del],[data-c],[data-y]," +
            "[data-ny],[data-dy],[data-pick],[data-tr],[data-rs],[data-pd],[data-te],[data-" +
            "tp],[data-u],[data-f],[data-sel],[data-rg]"
        );
    if (!el) 
        return;
    if (sel !== null && el.dataset.i !== undefined) {
        selTap(el);
        return
    }
    if (el.dataset.sel) {
        selToggle();
        return
    }
    if (el.dataset.rg) {
        regenThumbs(el);
        return
    }
    if (el.dataset.f) {
        tf(el.dataset.f);
        return
    }
    if (el.dataset.u) {
        curU = el.dataset.u;
        render();
        return
    }
    if (el.dataset.tp) {
        tpv(el.dataset.tp);
        return
    }
    if (el.dataset.tr) {
        curT = true;
        render();
        return
    }
    if (el.dataset.rs) {
        restore(el.dataset.rs);
        return
    }
    if (el.dataset.pd) {
        pdel(el, el.dataset.pd);
        return
    }
    if (el.dataset.te) {
        tempty(el);
        return
    }
    if (el.dataset.pick) {
        openPick();
        return
    }
    if (el.dataset.ny) {
        openYear();
        return
    }
    if (el.dataset.y) {
        curY = +el.dataset.y;
        render();
        return
    }
    if (el.dataset.dy) {
        delYear(el);
        return
    }
    if (el.dataset.c) {
        coll[el.dataset.c] = !coll[el.dataset.c];
        render();
        return
    }
    if (el.dataset.m) {
        mode = el.dataset.m;
        render();
        return
    }
    if (el.dataset.del) {
        delAlb(el);
        return
    }
    if (el.dataset.add) {
        tgt = null;
        $("file").click()
    } else if (el.dataset.new) {
        openSheet()
    } else if (el.dataset.a) {
        cur = el.dataset.a;
        render()
    } else 
        openV(+el.dataset.i)
});
$("main").addEventListener("scroll", function () {
    if (!cur && !curY && !curT && !curU) 
        $("ttl").style.opacity = 0
});
$("back").onclick = function () {
    if (cur || curY || curT || curU) {
        cur = null;
        curY = null;
        curT = false;
        curU = null;
        render()
    }
};
document
    .querySelectorAll("#tabs button")
    .forEach(function (x) {
        x.onclick = function () {
            tab = x.dataset.t;
            cur = null;
            curY = null;
            curT = false;
            curU = null;
            render()
        }
    });
$("add").onclick = function () {
    if (tab === "alb" && !cur && !curY) 
        openSheet();
    else {
        tgt = null;
        $("file").click()
    }
};
function resize(f) {
    return new Promise(function (ok) {
        var r = new FileReader();
        r.onload = function () {
            var im = new Image();
            im.onload = function () {
                var s = Math.min(1, 1400 / Math.max(im.width, im.height)),
                    c = document.createElement("canvas");
                c.width = im.width * s;
                c.height = im.height * s;
                c
                    .getContext("2d")
                    .drawImage(im, 0, 0, c.width, c.height);
                ok(c.toDataURL("image/jpeg", .8))
            };
            im.onerror = function () {
                ok(null)
            };
            im.src = r.result
        };
        r.onerror = function () {
            ok(null)
        };
        r.readAsDataURL(f)
    })
}
$("file").onchange = async function (e) {
    var fs = []
            .slice
            .call(e.target.files),
        a = cur || tgt || (S.albums[0] && S.albums[0].id);
    tgt = null;
    if (!a) {
        e.target.value = "";
        openSheet();
        return
    }
    for (var i = 0; i < fs.length; i++) {
        var f = fs[i],
            id = Date.now() + "_" + i;
        if (f.type.indexOf("video/") === 0) {
            var pd = await vposter(f);
            var thumbUrl = await saveThumb(id, pd);
            var videoRef = ref(storage, 'videos/' + id + '_' + f.name);
            await uploadBytes(videoRef, f);
            var videoUrl = await getDownloadURL(videoRef);

            var photoObj = {
                id: id,
                a: a,
                d: thumbUrl,
                vUrl: videoUrl,
                t: f.lastModified || Date.now() + i,
                v: 1,
                du: f.du || 0,
                g: 1
            };
            S.photos.push(photoObj);
            await setDoc(doc(db, "photos", id), photoObj);
            continue;
        }
        var d = await resize(f);
        if (d) {
            var imageRef = ref(storage, 'images/' + id + '.jpg');
            var resBlob = await (await fetch(d)).blob();
            await uploadBytes(imageRef, resBlob);
            var imageUrl = await getDownloadURL(imageRef);

            var photoObj = {
                id: id,
                a: a,
                d: imageUrl,
                t: (await exifDate(f)) || f.lastModified || Date.now() + i
            };
            S.photos.push(photoObj);
            await setDoc(doc(db, "photos", id), photoObj);
        }
    }
    S
        .photos
        .forEach(function (p) {
            ay(p.t)
        });
    e.target.value = "";
    save();
    render()
};
function openSheet() {
    emo = EMO[0];
    $("nm").value = "";
    $("em").innerHTML = EMO
        .map(function (x, i) {
            return '<span class="' + (
                i
                    ? ''
                    : 'on'
            ) + '">' + x + '</span>'
        })
        .join("");
    $("sheet")
        .classList
        .add("on");
    setTimeout(function () {
        $("nm").focus()
    }, 50)
}
$("em").onclick = function (e) {
    if (e.target.tagName === "SPAN") {
        emo = e.target.textContent;
        []
            .forEach
            .call($("em").children, function (s) {
                s
                    .classList
                    .toggle("on", s === e.target)
            })
    }
};
$("sc").onclick = function () {
    $("sheet")
        .classList
        .remove("on")
};
$("sk").onclick = async function () {
    var n = $("nm")
        .value
        .trim();
    if (!n) 
        return;
    S
        .albums
        .push({
            id: "a" + Date.now(),
            n: n,
            e: emo
        });
    await save();
    $("sheet")
        .classList
        .remove("on");
    render()
};
function openV(i) {
    vi = i;
    var s = $("vs");
    s.innerHTML = vlist
        .map(function (p) {
            return p.v
                ? '<div><video controls playsinline preload="none" poster="' + p.d +
                        '" src="' + (p.vUrl || '') + '" data-v="' + p.id + '"></video></div>'
                : '<div><img src="' + p.d + '"></div>'
        })
        .join("");
    $("viewer")
        .classList
        .add("on");
    $("vd")
        .classList
        .remove("arm");
    s.scrollLeft = i * s.clientWidth;
    cnt()
}
$("vx").onclick = function () {
    sv = -1;
    $("viewer")
        .classList
        .remove("on");
    $("vs").innerHTML = "";
    if (dirty) {
        dirty = false;
        render()
    }
};
$("dpk").onclick = async function () {
    if (dpm) {
        $("dp").classList.remove("on");
        await trashMany();
        return
    }
    $("dp")
        .classList
        .remove("on");
    var p = vlist[vi];
    S.photos = S
        .photos
        .filter(function (x) {
            return x.id !== p.id
        });
    await deleteDoc(doc(db, "photos", p.id));
    p.x = Date.now();
    (S.trash = S.trash || []).push(p);
    await save();
    $("viewer")
        .classList
        .remove("on");
    render()
};
$("main").addEventListener("scroll", function (e) {
    var s = e.target;
    if (!s.classList || !s.classList.contains("sw") || s.children.length < 2) 
        return;
    var n = s.children.length - 1,
        w = s
            .children[0]
            .offsetWidth + 12,
        i = Math.min(n - 1, Math.round(s.scrollLeft / w)),
        c = $("cn");
    if (c) 
        c.textContent = (i + 1) + " / " + n
}, true);
var mode = "b";
function ygrid(list) {
    if (!list.length) 
        return '<div class="empty"><b>사진 없음</b>오른쪽 위 ＋ 버튼으로<br>사진을 추가해 보세요.</div>';
    var out = "",
        y = null;
    list.forEach(function (p, i) {
        var yr = new Date(p.t).getFullYear();
        if (yr !== y) {
            if (y !== null) 
                out += '</div>';
            y = yr;
            var c = list
                .filter(function (q) {
                    return new Date(q.t).getFullYear() === yr
                })
                .length;
            out += '<div class="yh">' + yr + '<span>' + c + '장</span></div><div class="sw yr">'
        }
        out += '<div data-i="' + i + '"><img src="' + p.d + '" loading="lazy">' + (
            p.v
                ? '<span class="pl">▶</span>'
                : ''
        ) + '</div>'
    });
    return out + '</div>'
}
async function delAlb(b) {
    if (b.textContent === "앨범 삭제") {
        var n = ph(cur).length;
        b.textContent = n
            ? "사진 " + n + "장은 휴지통으로 이동해요 · 한 번 더 누르세요"
            : "한 번 더 누르면 삭제돼요";
        return
    }
    S.albums = S
        .albums
        .filter(function (x) {
            return x.id !== cur
        });
    S
        .photos
        .forEach(async function (x) {
            if (x.a === cur) {
                x.x = Date.now();
                (S.trash = S.trash || []).push(x);
                await deleteDoc(doc(db, "photos", x.id));
            }
        });
    S.photos = S
        .photos
        .filter(function (x) {
            return x.a !== cur
        });
    cur = null;
    await save();
    render()
}
var coll = {};
function sec(k, n, h) {
    var c = coll[k];
    return '<div class="sh"><span>' + n + ' <i>›</i></span><button data-c="' + k +
            '" class="' + (
        c
            ? "cl"
            : ""
    ) + '"></button></div>' + (
        c
            ? ""
            : '<div class="rw">' + h + '</div>'
    )
}
function home() {
    var al = S
        .albums
        .map(function (a) {
            var l = ph(a.id);
            return '<div class="ca" data-a="' + a.id + '">' + (
                l[0]
                    ? '<img src="' + l[0].d + '">'
                    : '<b>' + a.e + '</b>'
            ) + '<div class="lb"><span class="n">' + esc(a.n) + '</span><span class="c">' +
                    l.length + '</span></div></div>'
        })
        .join("") + '<div class="ca nw" data-new="1">＋<div class="lb"><span class="n">새로운 앨범</span></div></div>';
    var rc = vlist
        .slice(0, 12)
        .map(function (p, i) {
            return '<div class="ca" data-i="' + i + '"><img src="' + p.d + '" loading="lazy' +
                    '">' + (
                p.v
                    ? '<span class="pl">▶</span>'
                    : ''
            ) + '</div>'
        })
        .join("");
    return '<h1 class="hm">모음<button class="hp" data-pick="1">📷 사진 추가</button></h1>' +
            sec("alb", "앨범", al) + sec("yr", "연도별", ycards()) + (
        rc
            ? sec("rec", "최근 항목", rc)
            : ""
    ) + sec("tr", "유틸리티", tcard())
}(function () {
    var m = $("main"),
        d = null,
        moved = false;
    m.addEventListener("pointerdown", function (e) {
        moved = false;
        var r = e
            .target
            .closest(".rw,.sw");
        if (!r || e.pointerType !== "mouse") 
            return;
        d = {
            r: r,
            x: e.clientX,
            s: r.scrollLeft
        }
    });
    window.addEventListener("pointermove", function (e) {
        if (!d) 
            return;
        var dx = e.clientX - d.x;
        if (Math.abs(dx) > 5 && !moved) {
            moved = true;
            d.r.style.scrollSnapType = "none";
            d.r.style.cursor = "grabbing"
        }
        if (moved) 
            d.r.scrollLeft = d.s - dx
    });
    window.addEventListener("pointerup", function () {
        if (!d) 
            return;
        d.r.style.scrollSnapType = "";
        d.r.style.cursor = "";
        d = null
    });
    m.addEventListener("click", function (e) {
        if (moved) {
            e.stopPropagation();
            moved = false
        }
    }, true);
    m.addEventListener("dragstart", function (e) {
        e.preventDefault()
    })
})();
var dirty = false;
function dfill(id, a, b, sel, sf) {
    var h = "";
    for (var i = a; i <= b; i++) 
        h += '<option value="' + i + '"' + (
            i === sel
                ? " selected"
                : ""
        ) + '>' + i + sf + '</option>';
    $(id).innerHTML = h
}
function dmax() {
    var n = new Date(+$("dy").value, + $("dm").value, 0).getDate();
    dfill("dd", 1, n, Math.min(+$("dd").value || 1, n), "일")
}
$("vdt").onclick = function () {
    var p = vlist[vi];
    if (!p) 
        return;
    var d = new Date(p.t);
    dfill(
        "dy",
        Math.min(1980, d.getFullYear()),
        Math.max(new Date().getFullYear(), d.getFullYear()),
        d.getFullYear(),
        "년"
    );
    dfill("dm", 1, 12, d.getMonth() + 1, "월");
    dfill(
        "dd",
        1,
        new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
        d.getDate(),
        "일"
    );
    $("dsheet")
        .classList
        .add("on")
};
$("dy").onchange = $("dm").onchange = dmax;
$("dc").onclick = function () {
    $("dsheet")
        .classList
        .remove("on")
};
$("dk").onclick = async function () {
    var p = vlist[vi];
    if (p) {
        var o = new Date(p.t);
        p.t = new Date(
            +$("dy").value,
            + $("dm").value - 1,
            + $("dd").value,
            o.getHours(),
            o.getMinutes()
        ).getTime();
        ay(p.t);
        await setDoc(doc(db, "photos", p.id), p);
        dirty = true;
        cnt()
    }
    $("dsheet")
        .classList
        .remove("on")
};
function exifParse(v) {
    if (v.getUint16(0) !== 0xFFD8) 
        return null;
    var o = 2;
    while (o < v.byteLength - 4) {
        var mk = v.getUint16(o);
        if ((mk & 0xFF00) !== 0xFF00) 
            return null;
        var len = v.getUint16(o + 2);
        if (mk === 0xFFE1 && v.getUint32(o + 4) === 0x45786966) {
            var t = o + 10,
                le = v.getUint16(t) === 0x4949,
                u16 = function (p) {
                    return v.getUint16(p, le)
                },
                u32 = function (p) {
                    return v.getUint32(p, le)
                };
            var f = function (p, tag) {
                var n = u16(t + p);
                for (var i = 0; i < n; i++) {
                    var e = t + p + 2 + i * 12;
                    if (u16(e) === tag) 
                        return u32(e + 8)
                }
                return null
            };
            var i0 = u32(t + 4),
                ex = f(i0, 0x8769),
                off = ex != null
                    ? f(ex, 0x9003)
                    : null;
            if (off == null) 
                off = f(i0, 0x0132);
            if (off == null) 
                return null;
            var s = "";
            for (var k = 0; k < 19; k++) 
                s += String.fromCharCode(v.getUint8(t + off + k));
            var m = s.match(/^(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d):(\d\d)/);
            if (!m || m[1] === "0000") 
                return null;
            return new Date(+m[1], m[2] - 1, + m[3], + m[4], + m[5], + m[6]).getTime()
        }
        o += 2 + len
    }
    return null
}
function exifDate(f) {
    return f
        .slice(0, 262144)
        .arrayBuffer()
        .then(function (b) {
            try {
                return exifParse(new DataView(b))
            } catch (e) {
                return null
            }
        })
        .catch(function () {
            return null
        })
    }
var VPH = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height=" +
            "'3'%3E%3Crect width='4' height='3' fill='%23333'/%3E%3C/svg%3E";
// 영상에서 썸네일(JPG dataURL)을 뽑는다. f는 File/Blob 또는 영상 주소(string)
// - 첫 장면이 검으면 다른 시점(1.5초, 0.1초, 3초)으로 다시 시도한다
// - 화면이 실제로 그려진 뒤에 캡처한다(requestVideoFrameCallback 사용)
function vposter(f) {
    return new Promise(function (ok) {
        var isUrl = typeof f === "string",
            u = isUrl
                ? f
                : URL.createObjectURL(f),
            v = document.createElement("video"),
            tr = [
                .5, 1.5, .1, 3
            ],
            ti = 0,
            fin = false,
            tm = null;
        if (isUrl) 
            v.crossOrigin = "anonymous";
        v.muted = true;
        v.playsInline = true;
        v.preload = "auto";
        v.setAttribute("playsinline", "");
        function done(r) {
            if (fin) 
                return;
            fin = true;
            clearTimeout(tm);
            try {
                v.pause()
            } catch (e) {}
            v.removeAttribute("src");
            try {
                v.load()
            } catch (e) {}
            if (!isUrl) 
                URL.revokeObjectURL(u);
            ok(r)
        }
        function snap() {
            try {
                if (!v.videoWidth) 
                    return null;
                var s = Math.min(1, 600 / Math.max(v.videoWidth, v.videoHeight)),
                    c = document.createElement("canvas");
                c.width = Math.max(1, Math.round(v.videoWidth * s));
                c.height = Math.max(1, Math.round(v.videoHeight * s));
                var x = c.getContext("2d");
                x.drawImage(v, 0, 0, c.width, c.height);
                var d = x
                        .getImageData(0, 0, c.width, c.height)
                        .data,
                    sum = 0,
                    n = 0;
                for (var i = 0; i < d.length; i += 160) {
                    sum += d[i] + d[i + 1] + d[i + 2];
                    n++
                }
                return {
                    u: c.toDataURL("image/jpeg", .7),
                    b: sum / n / 3
                }
            } catch (e) {
                return null
            }
        }
        function seek() {
            var d = v.duration || 0,
                t = tr[ti];
            if (d && isFinite(d) && t > d * .9) 
                t = d / 2;
            try {
                v.currentTime = t
            } catch (e) {}
        }
        v.onloadedmetadata = function () {
            if (!isUrl) 
                f.du = v.duration;
            vposter.du = v.duration;
            seek()
        };
        v.onseeked = function () {
            var fired = false;
            function go() {
                if (fired) 
                    return;
                fired = true;
                var r = snap();
                if (!r) {
                    done(null);
                    return
                }
                if (r.b > 12 || ti >= tr.length - 1) {
                    done(r.u);
                    return
                }
                ti++;
                seek()
            }
            if (v.requestVideoFrameCallback) 
                v.requestVideoFrameCallback(go);
            setTimeout(go, 300)
        };
        v.onerror = function () {
            done(null)
        };
        v.src = u;
        var pr = v.play();
        if (pr && pr.catch) 
            pr.catch(function () {});
        tm = setTimeout(function () {
            var r = snap();
            done(
                r
                    ? r.u
                    : null
            )
        }, 12000)
    })
}
// 썸네일을 Storage에 올리고 주소를 돌려준다(실패하면 dataURL 그대로, 아예 못 뽑았으면 회색 그림)
async function saveThumb(id, dataUrl) {
    if (!dataUrl) 
        return VPH;
    try {
        var tb = await(await fetch(dataUrl)).blob();
        var tref = ref(storage, 'thumbs/' + id + '.jpg');
        await uploadBytes(tref, tb);
        return await getDownloadURL(tref)
    } catch (e) {
        console.error("썸네일 저장 실패:", e);
        return dataUrl
    }
}
// 이미 올린 영상들의 썸네일을 다시 만든다(Storage CORS 설정 필요: cors.json 참고)
async function regenThumbs(btn) {
    var vs = S
        .photos
        .filter(function (p) {
            return p.v && p.vUrl
        });
    if (!vs.length) 
        return;
    var ok = 0,
        fail = 0;
    for (var i = 0; i < vs.length; i++) {
        var p = vs[i];
        btn.textContent = "썸네일 만드는 중 " + (i + 1) + "/" + vs.length;
        try {
            vposter.du = 0;
            var du = await vposter(p.vUrl);
            if (!du) {
                fail++;
                continue
            }
            p.d = await saveThumb(p.id, du);
            if (vposter.du && isFinite(vposter.du)) 
                p.du = vposter.du;
            await setDoc(doc(db, "photos", p.id), p);
            ok++
        } catch (e) {
            console.error(e);
            fail++
        }
    }
    btn.textContent = ok + "개 완료" + (
        fail
            ? " · " + fail + "개 실패(Storage CORS 설정을 확인하세요)"
            : ""
    );
    setTimeout(function () {
        var m = $("main"),
            st = m.scrollTop;
        render();
        m.scrollTop = st
    }, 2500)
}
var curY = null;
function yrs() {
    if (!S.years || !S.years.length) {
        var y = new Date().getFullYear();
        S.years = [
            y, y - 1
        ]
    }
    return S.years
}
function ay(t) {
    var y = new Date(t).getFullYear();
    if (yrs().indexOf(y) < 0) 
        yrs().push(y)
}
function py(y) {
    return ph().filter(function (p) {
        return new Date(p.t).getFullYear() === y
    })
}
function dstr(t) {
    var d = new Date(t);
    return d.getFullYear() + "년 " + (
        d.getMonth() + 1
    ) + "월 " + d.getDate() + "일"
}
function fd(s) {
    s = Math.round(s);
    return Math.floor(s / 60) + ":" + (
        "0" + s % 60
    ).slice(-2)
}
function lgrid(l) {
    return '<div class="lg">' + l
        .map(function (p, i) {
            return '<div data-i="' + i + '"><img src="' + p.d + '" loading="lazy">' +
                    hbtn(p) + '<span class="ck"></span>' + (
                p.v
                    ? '<span class="du">' + (
                        p.du
                            ? fd(p.du)
                            : "▶"
                    ) + '</span>'
                    : ""
            ) + '</div>'
        })
        .join("") + '</div>'
}
function lib() {
    var l = vlist,
        h = '<h1>보관함<button class="hp" data-sel="1">선택</button></h1><div class="sd" id="lsub">' + l.length + "개 항목</div>";
    return h + (
        l.length
            ? lgrid(l)
            : '<div class="empty"><b>사진 없음</b>오른쪽 위 ＋ 버튼으로<br>사진을 추가해 보세요.</div>'
    )
}
function ylib(y) {
    var l = vlist;
    return '<h1>' + y + '년<button class="hp" data-sel="1">선택</button></h1><div class="sd">사진 ' + l.length + '장</div>' + (
        l.length
            ? lgrid(l)
            : '<div class="empty"><b>이 연도의 사진이 없어요</b>사진 날짜가 ' + y + '년인 사진이 여기 모여요.</div>'
    ) + '<div class="dl"><button data-dy="1">연도 삭제</button></div>'
}
function ycards() {
    return yrs()
        .slice()
        .sort(function (a, b) {
            return b - a
        })
        .map(function (y) {
            var l = py(y);
            return '<div class="ca" data-y="' + y + '">' + (
                l[0]
                    ? '<img src="' + l[0].d + '">'
                    : '<b class="y">' + y + '</b>'
            ) + '<div class="lb"><span class="n">' + y + '년</span><span class="c">' + l.length +
                    '</span></div></div>'
        })
        .join("") + '<div class="ca nw" data-ny="1">＋<div class="lb"><span class="n">새 ' +
                '연도</span></div></div>'
}
function openYear() {
    ym = 0;
    $("ysh3").textContent = "연도 추가";
    $("yk").textContent = "추가";
    var cy = new Date().getFullYear(),
        h = "";
    for (var y = cy + 1; y >= 1980; y--) 
        if (yrs().indexOf(y) < 0) 
            h += '<option value="' + y + '">' + y + '년</option>';
$("yy").innerHTML = h;
    $("ysheet")
        .classList
        .add("on")
}
$("yc").onclick = function () {
    $("ysheet")
        .classList
        .remove("on")
};
$("yk").onclick = async function () {
    if (ym) {
        tgt = $("yy").value;
        $("ysheet")
            .classList
            .remove("on");
        $("file").click();
        return
    }
    var v = +$("yy").value;
    if (v && yrs().indexOf(v) < 0) {
        yrs().push(v);
        await save();
        render()
    }
    $("ysheet")
        .classList
        .remove("on")
};
async function delYear(b) {
    if (b.textContent === "연도 삭제") {
        b.textContent = "사진은 그대로 남아요 · 한 번 더 누르세요";
        return
    }
    S.years = yrs().filter(function (y) {
        return y !== curY
    });
    curY = null;
    await save();
    render()
}
$("main").addEventListener("scroll", function () {
    var g = document.querySelector(".lg"),
        s = $("lsub");
    if (!g || !s || !g.children[0] || !vlist.length) 
        return;
    var h = g
            .children[0]
            .offsetHeight + 2,
        i = Math.min(
            vlist.length - 1,
            Math.floor(Math.max(0, this.scrollTop - g.offsetTop) / h) * 3
        );
    s.textContent = this.scrollTop < 8
        ? vlist.length + "개 항목"
        : dstr(vlist[i].t)
});
function eff() {
    var t = document.documentElement.dataset.theme;
    return t || (
        matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
    )
}
function setTh(t) {
    document.documentElement.dataset.theme = t;
    try {
        localStorage.setItem("th", t)
    } catch (e) {}
    $("th").textContent = t === "dark"
        ? "☀️"
        : "🌙"
}
try {
    var st = localStorage.getItem("th");
    if (st) 
        document.documentElement.dataset.theme = st
} catch (e) {}
$("th").textContent = eff() === "dark"
    ? "☀️"
    : "🌙";
$("th").onclick = function () {
    setTh(
        eff() === "dark"
            ? "light"
            : "dark"
    )
};
$("main").addEventListener("click", function (e) {
    var h = e
        .target
        .closest("h1");
    if (!h || h.classList.contains("nt") || e.target.closest("button")) 
        return;
    if (e.clientX > h.getBoundingClientRect().right - 72) 
        $("add").onclick()
});
var ym = 0,
    tgt = null;
function openPick() {
    if (!S.albums.length) {
        openSheet();
        return
    }
    ym = 1;
    $("ysh3").textContent = "어느 앨범에 넣을까요?";
    $("yk").textContent = "사진 고르기";
    $("yy").innerHTML = S
        .albums
        .map(function (a) {
            return '<option value="' + a.id + '">' + esc(a.e + " " + a.n) + '</option>'
        })
        .join("");
    $("ysheet")
        .classList
        .add("on")
}
function vgrid(l) {
    return vgrid2(l)
}
var curT = false;
function vgrid2(l) {
    return '<div class="vf">' + l
        .map(function (p, i) {
            return '<div class="ca" data-i="' + i + '"><img src="' + p.d + '" loading="lazy' +
                    '">' + hbtn(p) + '<span class="ck"></span>' + (
                p.v
                    ? '<span class="pl">▶ ' + (
                        p.du
                            ? fd(p.du)
                            : ""
                    ) + '</span>'
                    : ""
            ) + '</div>'
        })
        .join("") + '<div class="ca nw" data-add="1">＋<div class="lb"><span class="n">사' +
                '진 추가</span></div></div></div><div class="cn">' + (
        l.length
            ? "사진 " + l.length + "장"
            : "아직 사진이 없어요"
    ) + '</div>'
}
function tleft(p) {
    return Math.max(30 - Math.floor((Date.now() - p.x) / 864e5), 0) + "일 남음"
}
function trashView() {
    var l = (S.trash || [])
            .slice()
            .sort(function (a, b) {
                return b.x - a.x
            }),
        h = '<h1 class="nt">휴지통</h1><div class="sd">' + (
            l.length
                ? '사진을 누르면 크게 볼 수 있어요 · 30일 뒤 완전히 삭제돼요'
                : ''
        ) + '</div>';
    if (!l.length) 
        return h +
                '<div class="empty"><b>휴지통이 비어 있어요</b>삭제한 사진과 동영상이 여기에 보관돼요.</div>';
    return h + '<div class="tl">' + l
        .map(function (p) {
            return '<div class="tr"><img class="tt" data-tp="' + p.id + '" src="' + p.d + '"><div class="ti"><b>' + (
                p.v
                    ? '동영상'
                    : '사진'
            ) + '</b><span>' + dstr(p.t) + '</span></div><button data-rs' +
                    '="' + p.id + '">복구</button><button class="rd" data-pd="' + p.id + '">삭제</butto' +
                    'n></div>'
        })
        .join("") +
                '</div><div class="dl"><button data-te="1">휴지통 비우기</button></div>'
}
async function restore(id) {
    var p = (S.trash || []).filter(function (x) {
        return x.id === id
    })[0];
    if (!p) 
        return;
    S.trash = S
        .trash
        .filter(function (x) {
            return x.id !== id
        });
    delete p.x;
    if (!S.albums.some(function (a) {
        return a.id === p.a
    })) 
        p.a = (S.albums[0] && S.albums[0].id) || null;
    S
        .photos
        .push(p);
    await setDoc(doc(db, "photos", p.id), p);
    ay(p.t);
    await save();
    render()
}
async function pdel(b, id) {
    if (b.textContent === "삭제") {
        b.textContent = "정말 삭제";
        return
    }
    S.trash = (S.trash || []).filter(function (x) {
        return x.id !== id
    });
    await save();
    render()
}
async function tempty(b) {
    if (b.textContent === "휴지통 비우기") {
        b.textContent = "모두 완전히 삭제돼요 · 한 번 더 누르세요";
        return
    }
    S.trash = [];
    await save();
    render()
}
var pvid = null,
    pvu = null;
function tpv(id) {
    var p = (S.trash || []).filter(function (x) {
        return x.id === id
    })[0];
    if (!p) 
        return;
    pvid = id;
    $("pvt").textContent = (
        p.v
            ? "동영상"
            : "사진"
    ) + " · " + dstr(p.t);
    if (p.v) {
        $("pvm").innerHTML = '<video playsinline controls poster="' + p.d +
                '" src="' + (p.vUrl || '') + '"></video>';
    } else 
        $("pvm").innerHTML = '<img src="' + p.d + '">';
    $("pv")
        .classList
        .add("on")
}
function pclose() {
    $("pv")
        .classList
        .remove("on");
    $("pvm").innerHTML = "";
    pvid = null
}
$("pc").onclick = pclose;
$("pr").onclick = function () {
    var id = pvid;
    pclose();
    if (id) 
        restore(id)
};
$("pv").addEventListener("click", function (e) {
    if (e.target === this) 
        pclose()
});
var curU = null;
var UT = [
    {
        k: "vid",
        i: "🎬",
        n: "동영상",
        c: function () {
            return S
                .photos
                .filter(function (p) {
                    return p.v
                })
                .length
        }
    }, {
        k: "fav",
        i: "❤️",
        n: "즐겨찾기",
        c: function () {
            return S
                .photos
                .filter(function (p) {
                    return p.f
                })
                .length
        }
    }
];
function tcard() {
    var h = UT
        .map(function (u) {
            return '<div class="ur" data-u="' + u.k + '"><span class="ui">' + u.i + '</span' +
                    '><span class="un">' + u.n + '</span><span class="uc">' + u.c() + '</span><i>›<' +
                    '/i></div>'
        })
        .join("");
    return '<div class="ul">' + h + '<div class="ur" data-tr="1"><span class="ui">🗑️</span><span class="un">휴지통</span><span class="uc">' + (
        S.trash || []
    ).length + '</span><i>›</i></div></div>'
}
function vidView() {
    var n = vlist.length;
    return '<h1 class="nt">동영상<button class="hp" data-sel="1">선택</button></h1><div class="sd">동영상 ' + n + '개</div>' + (
        n
            ? lgrid(vlist)
            : '<div class="empty"><b>동영상이 없어요</b>앨범에 동영상을 추가하면 여기에 모여요.</div>'
    ) + (
        n
            ? '<div class="dl"><button class="bl" data-rg="1">썸네일 다시 만들기</button></div>'
            : ''
    )
}
function heart(on) {
    return '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5' +
            ' 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3' +
            ' 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="' + (
        on
            ? "#ff3b30"
            : "none"
    ) + '" stroke="' + (
        on
            ? "#ff3b30"
            : "currentColor"
    ) + '" stroke-width="2" stroke-linejoin="round"/></svg>'
}
function hbtn(p) {
    return '<span class="hb" data-f="' + p.id + '">' + heart(p.f) + '</span>'
}
function favView() {
    var n = vlist.length;
    return '<h1 class="nt">즐겨찾기<button class="hp" data-sel="1">선택</button></h1><div class="sd">사진 ' + n + '장</div>' + (
        n
            ? lgrid(vlist)
            : '<div class="empty"><b>즐겨찾기가 비어 있어요</b>사진의 하트를 누르면 여기에 모여요.</div>'
    )
}
async function tf(id) {
    var p = S
        .photos
        .filter(function (x) {
            return x.id === id
        })[0];
    if (!p) 
        return;
    p.f = p.f
        ? 0
        : 1;
    await setDoc(doc(db, "photos", id), p);
    var vo = $("viewer")
        .classList
        .contains("on");
    if (curU === "fav") {
        if (vo) 
            dirty = true;
        else {
            var m = $("main"),
                st = m.scrollTop;
            render();
            m.scrollTop = st
        }
    } else 
        []
            .forEach
            .call(document.querySelectorAll('[data-f="' + id + '"]'), function (e) {
                e.innerHTML = heart(p.f)
            });
    if (vo) 
        cnt()
}
$("vh").onclick = function () {
    var p = vlist[vi];
    if (p) 
        tf(p.id)
};
$("vp").onclick = function () {
    var s = $("vs");
    s.scrollBy({
        left: -s.clientWidth,
        behavior: "smooth"
    })
};
$("vn").onclick = function () {
    var s = $("vs");
    s.scrollBy({left: s.clientWidth, behavior: "smooth"})
};
document.addEventListener("keydown", function (e) {
    if (!$("viewer").classList.contains("on")) 
        return;
    if (e.key === "ArrowRight") 
        $("vn").click();
    else if (e.key === "ArrowLeft") 
        $("vp").click();
    else if (e.key === "Escape") 
        $("vx").click()
});
var sv = -1;
function tstr(t) {
    var d = new Date(t),
        h = d.getHours(),
        z = function (n) {
            return (
                n < 10
                    ? "0"
                    : ""
            ) + n
        };
    return (
        d.getFullYear() !== new Date().getFullYear()
            ? d.getFullYear() + "년 "
            : ""
    ) + (d.getMonth() + 1) + "월 " + d.getDate() + "일 " + (
        h < 12
            ? "오전"
            : "오후"
    ) + " " + (
        h % 12 || 12
    ) + ":" + z(d.getMinutes())
}
function strip() {
    if (sv === vi) 
        return;
    sv = vi;
    var h = "",
        a = Math.max(0, vi - 9),
        b = Math.min(vlist.length - 1, vi + 9);
    for (var i = a; i <= b; i++) 
        h += '<img src="' + vlist[i].d + '" data-g="' + i + '"' + (
            i === vi
                ? ' class="cu"'
                : ''
        ) + '>';
    $("vstrip").innerHTML = h
}
function cnt() {
    var p = vlist[vi];
    if (!p) 
        return;
    var a = S
        .albums
        .filter(function (x) {
            return x.id === p.a
        })[0];
    $("vt1").textContent = a
        ? a.n
        : (
            p.v
                ? "동영상"
                : "사진"
        );
    $("vds").textContent = tstr(p.t);
    $("vh").innerHTML = heart(p.f);
    $("vp").style.visibility = vi > 0
        ? "visible"
        : "hidden";
    $("vn").style.visibility = vi < vlist.length - 1
        ? "visible"
        : "hidden";
    strip()
}
$("vstrip").addEventListener("click", function (e) {
    var g = e.target.getAttribute && e
        .target
        .getAttribute("data-g");
    if (g == null) 
        return;
    var s = $("vs");
    s.scrollTo({
        left: +g * s.clientWidth,
        behavior: "auto"
    })
});
if (!(navigator.share && navigator.canShare)) 
    $("vsh").style.visibility = "hidden";
$("vsh").onclick = async function () {
    var p = vlist[vi];
    if (!p) 
        return;
    try {
        var b = await(await fetch(p.v ? p.vUrl : p.d)).blob();
        if (!b) 
            return;
        var f = new File([b], (
            p.v
                ? "video.mp4"
                : "photo.jpg"
        ), {
            type: b.type || (
                p.v
                    ? "video/mp4"
                    : "image/jpeg"
            )
        });
        if (navigator.canShare({files: [f]})) 
            await navigator.share({files: [f]})
    } catch (e) {}
};
$("vd").onclick = function () {
    dpm = false;
    var p = vlist[vi];
    if (!p) 
        return;
    $("dpt").textContent = p.v
        ? "이 동영상이 앨범에서 삭제됩니다."
        : "이 사진이 앨범에서 삭제됩니다.";
    $("dpk").textContent = p.v
        ? "동영상 삭제"
        : "사진 삭제";
    $("dp")
        .classList
        .add("on")
};
$("dp").addEventListener("click", function (e) {
    if (e.target === this) 
        this
            .classList
            .remove("on")
    });
(function () {
    var s = $("vs"),
        d = null;
    s.addEventListener("pointerdown", function (e) {
        if (e.pointerType !== "mouse" || e.target.tagName === "VIDEO") 
            return;
        d = {
            x: e.clientX,
            l: s.scrollLeft,
            v: vi,
            m: false
        }
    });
    window.addEventListener("pointermove", function (e) {
        if (!d) 
            return;
        var dx = e.clientX - d.x;
        if (!d.m && Math.abs(dx) > 4) {
            d.m = true;
            s.style.scrollSnapType = "none";
            s.style.cursor = "grabbing"
        }
        if (d.m) 
            s.scrollLeft = d.l - dx
    });
    window.addEventListener("pointerup", function (e) {
        if (!d) 
            return;
        var dx = e.clientX - d.x,
            m = d.m,
            v0 = d.v;
            d = null;
        s.style.cursor = "";
        if (!m) 
            return;
        var t = Math.max(0, Math.min(vlist.length - 1, v0 + (
            dx < -40
                ? 1
                : dx > 40
                    ? -1
                    : 0
        )));
        s.style.scrollSnapType = "";
        s.scrollTo({
            left: t * s.clientWidth,
            behavior: "smooth"
        })
    });
    s.addEventListener("dragstart", function (e) {
        e.preventDefault()
    })
})();

// 비디오 재생을 위한 헬퍼 함수 추가
function vload(s) {
    []
        .forEach
        .call(s.querySelectorAll("video"), function (el) {
            // 이미 vUrl이 설정되어 있으므로 별도의 blob 로드 불필요
        });
}

// ===== 여러 장 선택 · 삭제 =====
var sel = null,
    dpm = false;
function render() {
    render0();
    selApply()
}
function selApply() {
    var m = $("main");
    if (sel !== null && !m.querySelector(".lg,.vf")) 
        sel = null;
    document
        .body
        .classList
        .toggle("selm", sel !== null);
    if (sel === null) 
        return;
    []
        .forEach
        .call(m.querySelectorAll("[data-i]"), function (e) {
            var p = vlist[+e.dataset.i];
            e
                .classList
                .toggle("picked", !!(p && sel[p.id]))
        });
    []
        .forEach
        .call(m.querySelectorAll("[data-sel]"), function (b) {
            b.textContent = "취소"
        });
    selBar()
}
function selBar() {
    var n = Object
            .keys(sel)
            .length,
        all = vlist.length > 0 && vlist.every(function (p) {
            return sel[p.id]
        });
    $("sn").textContent = n
        ? n + "개 선택됨"
        : "항목 선택";
    $("sdl").disabled = !n;
    $("sal").textContent = all
        ? "선택 해제"
        : "전체 선택"
}
function selToggle() {
    sel = sel === null
        ? {}
        : null;
    render()
}
function selTap(el) {
    var p = vlist[+el.dataset.i];
    if (!p) 
        return;
    if (sel[p.id]) 
        delete sel[p.id];
    else 
        sel[p.id] = 1;
    el
        .classList
        .toggle("picked", !!sel[p.id]);
    selBar()
}
$("sal").onclick = function () {
    var all = vlist.length > 0 && vlist.every(function (p) {
        return sel[p.id]
    });
    vlist.forEach(function (p) {
        if (all) 
            delete sel[p.id];
        else 
            sel[p.id] = 1
    });
    selApply()
};
$("sdl").onclick = function () {
    var n = Object
        .keys(sel || {})
        .length;
    if (!n) 
        return;
    dpm = true;
    $("dpt").textContent = "선택한 항목 " + n + "개가 삭제됩니다.";
    $("dpk").textContent = n + "개 삭제";
    $("dp")
        .classList
        .add("on")
};
// 여러 장을 휴지통으로 옮긴다. 화면(S)은 바로 바꾸고, Firestore는 한 번에(배치) 정리한다
async function trashPhotos(ids) {
    var set = {},
        now = Date.now(),
        moved = [];
    ids.forEach(function (i) {
        set[i] = 1
    });
    S
        .photos
        .forEach(function (p) {
            if (set[p.id]) {
                p.x = now;
                moved.push(p)
            }
        });
    S.photos = S
        .photos
        .filter(function (p) {
            return !set[p.id]
        });
    moved.forEach(function (p) {
        (S.trash = S.trash || []).push(p)
    });
    try {
        for (var i = 0; i < moved.length; i += 400) {
            var b = writeBatch(db);
            moved
                .slice(i, i + 400)
                .forEach(function (p) {
                    b.delete(doc(db, "photos", p.id))
                });
            await b.commit()
        }
        await save()
    } catch (e) {
        console.error("삭제 실패:", e)
    }
}
async function trashMany() {
    var ids = Object.keys(sel || {});
    sel = null;
    var m = $("main"),
        st = m.scrollTop,
        job = trashPhotos(ids);
    render();
    m.scrollTop = st;
    await job
}

load(function () {
    render();
});
