# Only For U — Website 3D "Planet Cinta"

Alurnya sekarang 3 tahap:
1. **Gerbang** — pertanyaan "Mau lihat cewe tercantik di dunia gak?" dengan tombol "mauuu😍" dan "gakkk mw lahh😒" (tombol ini sengaja kabur terus, gak akan bisa dipencet).
2. **Loading** — animasi mini planet berputar (~4 detik).
3. **Dunia utama** — partikel berbentuk hati merah pekat, dikelilingi "cincin" partikel putih (seperti Saturnus), dengan foto-foto kecil rasio 9:16 melayang mengelilinginya, dengan latar bintang. Bisa digeser/diputar & di-zoom dengan jari atau mouse.

Dibuat dengan Three.js murni (tanpa build tools).

## Struktur folder

```
.
├── index.html
├── style.css
├── main.js
├── README.md
├── vendor/
│   ├── three.module.min.js
│   └── OrbitControls.js
└── assets/
    └── photos/
        ├── 1.png
        ├── 2.png
        ├── ...
        └── 10.png
```

## 1. Ganti foto

Timpa 10 file di `assets/photos/` dengan foto asli Anda, **nama file tetap** `1.png` sampai `10.png` (format PNG). Foto akan tampil sebagai kubus kecil melayang mengelilingi "planet hati". Foto persegi (1:1) akan terlihat paling rapi karena tiap foto dipasang di satu sisi kubus.

Kalau foto Anda `.jpg`, ganti bagian ini di `main.js`:
```js
const tex = texLoader.load(`assets/photos/${i}.png`);
```
menjadi `.jpg` sesuai file Anda.

## 2. Ganti nama / teks judul

Buka `main.js`, baris paling atas:
```js
const TITLE_TEXT = "Only For U, Kakaaa Piaaaaa🤍";
```
Ganti teksnya sesuai yang Anda mau. Teks ini otomatis dibuat bisa dibaca dari **depan maupun belakang** planet (dua sisi digambar terpisah), jadi tidak perlu edit apa pun lagi untuk itu.

Kalau mau ganti pertanyaan/tombol di layar gerbang, cari di `index.html`:
```html
<p class="gate-question">Mau lihat cewe tercantik<br>di dunia gak?</p>
...
<button id="gateYes" ...>mauuu😍</button>
<button id="gateNo" ...>gakkk mw lahh😒</button>
```

## 3. Coba di komputer sendiri

Karena situs ini pakai ES Module (`import`), harus dibuka lewat server lokal, tidak bisa dobel klik langsung file `index.html`:

```bash
python3 -m http.server 8080
```
Lalu buka `http://localhost:8080` di browser.

## 4. Upload ke GitHub & aktifkan GitHub Pages

```bash
git init
git add .
git commit -m "Website only for u"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

Lalu di GitHub: **Settings → Pages → Source**: pilih branch `main`, folder `/ (root)` → **Save**.
Setelah 1–2 menit, situs aktif di:
```
https://USERNAME.github.io/NAMA-REPO/
```

## Kontrol interaksi

- **Geser / drag** — memutar sudut pandang
- **Cubit / scroll wheel** — zoom in/out (dibatasi agar tidak terlalu dekat/jauh)
- Planet beserta foto-foto akan tetap tumbling pelan otomatis meskipun tidak disentuh.
- Loading awal sengaja ditahan minimal ~4 detik walau asetnya kecil, supaya tidak terasa "kedip" sekilas.
- Ada 24 kartu foto kecil yang tersebar dalam beberapa kelompok, hasil acak dari 10 foto sumber (jadi wajar kalau foto yang sama muncul lebih dari sekali).

## ⚠️ Kalau update tidak terlihat setelah push ke GitHub

Browser dan GitHub Pages sering **cache** file `main.js` yang lama. Kalau kamu sudah `git push` tapi situs masih berperilaku seperti versi lama (misalnya masih terasa "stuck"):

1. Pastikan commit & push-nya benar-benar berhasil (`git status`, `git log -1`).
2. Tunggu 1–2 menit untuk build GitHub Pages selesai.
3. **Hard refresh**: di iPhone Safari, buka situs lalu tarik ke bawah untuk refresh, atau hapus cache lewat Settings → Safari → Clear History and Website Data. Di Chrome/desktop, `Ctrl/Cmd+Shift+R`.
4. File `index.html` di sini sudah memuat `main.js?v=3` (ada versi di belakangnya) supaya browser tahu file-nya berubah — kalau Anda edit `main.js` lagi nanti, naikkan angka `v=` ini (jadi `v=4`, dst) supaya cache selalu diperbarui.

## Catatan teknis

- Three.js (`vendor/three.module.min.js`) dan `OrbitControls.js` sudah disertakan langsung di folder `vendor/`, jadi **tidak butuh internet/CDN** untuk librarynya — hanya font judul (Google Fonts "Playfair Display") yang butuh internet, dan otomatis fallback ke font serif biasa kalau offline.
- Tidak perlu `npm install` atau build tools apa pun untuk menjalankan atau mendeploy situs ini.
- Kalau ingin memperbanyak/mengurangi jumlah foto, ubah `PHOTO_COUNT` di awal `main.js` dan sesuaikan jumlah file di `assets/photos/`.
