# Only For U — Website 3D "Planet Cinta"

Website 3D interaktif: partikel berbentuk hati merah yang dikelilingi "cincin" partikel putih (seperti Saturnus), dengan 10 foto melayang sebagai kubus polaroid kecil di sekelilingnya, dengan latar bintang. Bisa digeser/diputar dengan jari atau mouse. Dibuat dengan Three.js murni (tanpa build tools).

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
const RECIPIENT_NAME = "Kamu";
const TITLE_TEXT = `Only For U, ${RECIPIENT_NAME}`;
```
Ganti `"Kamu"` dengan nama yang Anda mau tampilkan, contoh:
```js
const RECIPIENT_NAME = "Ayu Anita Purnama";
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
- **Cubit / scroll** — zoom in/out (dibatasi agar tidak terlalu dekat/jauh)
- Planet hati beserta foto-foto akan tetap tumbling pelan otomatis meskipun tidak disentuh.

## Catatan teknis

- Three.js (`vendor/three.module.min.js`) dan `OrbitControls.js` sudah disertakan langsung di folder `vendor/`, jadi **tidak butuh internet/CDN** untuk librarynya — hanya font judul (Google Fonts "Playfair Display") yang butuh internet, dan otomatis fallback ke font serif biasa kalau offline.
- Tidak perlu `npm install` atau build tools apa pun untuk menjalankan atau mendeploy situs ini.
- Kalau ingin memperbanyak/mengurangi jumlah foto, ubah `PHOTO_COUNT` di awal `main.js` dan sesuaikan jumlah file di `assets/photos/`.
