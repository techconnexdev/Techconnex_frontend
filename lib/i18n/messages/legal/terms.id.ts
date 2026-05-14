import { legalTermsEn } from "./terms.en";

const overrides: Partial<Record<keyof typeof legalTermsEn, string>> = {
  "legal.terms.h1": "Ketentuan Layanan",
  "legal.terms.intro.p1a":
    "Ketentuan Layanan (\"Ketentuan\") ini mengatur akses dan penggunaan Anda terhadap TechConnex, platform layanan TIK yang dioperasikan oleh CYBERNET CONSULTING SDN. BHD. (\"kami\"), tersedia di https://techconnex.vip. Dengan mengakses atau menggunakan TechConnex, Anda setuju secara hukum terikat oleh Ketentuan ini dan ",
  "legal.terms.intro.p1b":
    ". Jika Anda tidak setuju, Anda tidak boleh menggunakan Platform. Ketentuan ini merupakan perjanjian mengikat antara Anda dan CYBERNET CONSULTING SDN. BHD. Harap baca dengan saksama sebelum menggunakan TechConnex.",
  "legal.terms.s1.h": "1. Informasi Perusahaan",
  "legal.terms.s2.h": "2. Gambaran Platform",
  "legal.terms.s2.short":
    "TechConnex adalah platform digital yang menghubungkan perusahaan dengan penyedia layanan TIK. Kami adalah fasilitator, bukan pihak dalam kontrak pengguna.",
  "legal.terms.s2.p":
    "TechConnex adalah platform digital yang menghubungkan: perusahaan yang mencari layanan TIK dan teknologi, serta penyedia layanan (freelancer, profesional, atau firma) yang menawarkan layanan tersebut. TechConnex memfasilitasi: penemuan dan posting proyek; pencocokan perusahaan-penyedia berbantuan AI; pengelolaan proposal dan penawaran; penyerahan proyek dan pembayaran berbasis milestone; perpesanan dalam platform dan pertukaran file; penanganan sengketa dan dukungan penyelesaian; obrolan dukungan berbasis AI dengan eskalasi ke agen manusia. TechConnex bukan pihak dalam kontrak apa pun antara perusahaan dan penyedia layanan. Kami tidak mempekerjakan, mendukung, atau menjamin kinerja penyedia mana pun maupun kualitas proyek yang diposting di platform.",
  "legal.terms.s3.h": "3. Kelayakan",
  "legal.terms.s3.short":
    "Anda harus berusia minimal 18 tahun dan memiliki kapasitas hukum untuk menggunakan TechConnex.",
  "legal.terms.s3.p":
    "Untuk menggunakan TechConnex, Anda harus: berusia 18 tahun atau lebih (atau usia minimum setara di yurisdiksi Anda); memiliki kapasitas hukum untuk membuat kontrak yang mengikat; tidak dilarang menggunakan platform berdasarkan hukum yang berlaku; memberikan informasi pendaftaran yang akurat, lengkap, dan terbaru. Jika Anda mendaftar atas nama perusahaan atau organisasi, Anda menyatakan dan menjamin bahwa Anda memiliki kewenangan untuk mengikat entitas tersebut pada Ketentuan ini. Kami berhak menangguhkan atau menghentikan akun yang tidak memenuhi persyaratan ini kapan saja.",
  "legal.terms.s4.h": "4. Pendaftaran Akun & Keamanan",
  "legal.terms.s4.short":
    "Anda bertanggung jawab atas kredensial akun Anda dan seluruh aktivitas yang dilakukan melalui akun Anda.",
  "legal.terms.s4.your": "Kewajiban Anda",
  "legal.terms.s4.li1":
    "Memberikan informasi yang akurat dan lengkap saat pendaftaran",
  "legal.terms.s4.li2":
    "Menjaga kerahasiaan kredensial login Anda dan tidak membagikannya kepada pihak ketiga",
  "legal.terms.s4.li3":
    "Segera memberi tahu kami di techconn@techconnex.vip jika ada dugaan akses tidak sah atau pelanggaran keamanan",
  "legal.terms.s4.li4":
    "Memastikan informasi akun Anda tetap terkini dan mutakhir",
  "legal.terms.s4.our": "Hak Kami",
  "legal.terms.s4.ourP":
    "Kami dapat menangguhkan atau menghentikan akun yang diduga melakukan: penyalahgunaan, penipuan, atau tindakan menyesatkan; risiko keamanan bagi pengguna lain atau platform; pelanggaran terhadap bagian mana pun dari Ketentuan ini. Anda sepenuhnya bertanggung jawab atas semua aktivitas dalam akun Anda, baik diotorisasi oleh Anda maupun tidak.",
  "legal.terms.s5.h": "5. Peran & Tanggung Jawab Pengguna",
  "legal.terms.s5.h1": "5.1 Perusahaan",
  "legal.terms.s5.p1":
    "Perusahaan dapat: membuat dan memposting listing proyek dengan ruang lingkup, persyaratan, dan timeline yang jelas; meninjau proposal, penawaran, dan rekomendasi kecocokan yang dihasilkan AI; memberikan proyek dan membuat perjanjian dengan penyedia layanan; mengelola milestone proyek serta menyetujui atau meminta perubahan atas hasil kerja; melepas pembayaran milestone setelah penyerahan yang memuaskan; berkomunikasi dengan penyedia melalui platform.",
  "legal.terms.s5.h2": "5.2 Penyedia Layanan",
  "legal.terms.s5.p2":
    "Penyedia Layanan dapat: membuat dan memelihara profil profesional; mengajukan proposal dan penawaran pada proyek yang terdaftar; menyerahkan pekerjaan melalui struktur milestone yang disepakati dengan perusahaan; berkomunikasi dengan perusahaan melalui platform; menerima pembayaran setelah perusahaan menyetujui milestone yang selesai. Penyedia Layanan wajib menyelesaikan verifikasi identitas (KYC) saat diperlukan. Kegagalan menyelesaikan KYC dapat membatasi akses ke fitur pembayaran atau kemampuan mengajukan proposal.",
  "legal.terms.s5.h3": "5.3 Kewajiban Umum (Semua Pengguna)",
  "legal.terms.s5.li1":
    "Bertindak dengan itikad baik dalam semua interaksi di platform",
  "legal.terms.s5.li2":
    "Merepresentasikan kualifikasi, kemampuan, dan niat secara akurat",
  "legal.terms.s5.li3":
    "Mematuhi hukum yang berlaku, termasuk yang mengatur kontrak, ketenagakerjaan, dan perlindungan data",
  "legal.terms.s5.li4":
    "Tidak melakukan tindakan yang merusak reputasi atau integritas TechConnex atau pengguna lain",
  "legal.terms.s6.h": "6. Proyek, Kontrak & Hasil Kerja",
  "legal.terms.s6.p":
    "Perjanjian dibentuk langsung antara perusahaan dan penyedia. TechConnex tidak bertanggung jawab atas hasil proyek. Setiap perjanjian yang terbentuk melalui TechConnex sepenuhnya antara perusahaan dan penyedia layanan. TechConnex bukan pihak dalam perjanjian tersebut. Pengguna bertanggung jawab mendefinisikan persyaratan proyek, hasil kerja, timeline, dan kriteria penerimaan secara jelas sebelum pekerjaan dimulai. TechConnex tidak menjamin keberhasilan proyek, kualitas hasil kerja, atau ketepatan waktu penyelesaian. TechConnex tidak bertanggung jawab atas sengketa, keterlambatan, atau kegagalan yang timbul dari perjanjian pengguna. Pengguna dianjurkan menggunakan milestone dan alat perpesanan platform untuk mendokumentasikan seluruh perjanjian dan progres proyek.",
  "legal.terms.s7.h": "7. Pembayaran, Escrow & Biaya",
  "legal.terms.s7.short":
    "Pembayaran ditahan dalam escrow dan dilepas setelah persetujuan milestone. Biaya platform berlaku untuk transaksi.",
  "legal.terms.s7.pay": "Pemrosesan Pembayaran",
  "legal.terms.s7.payP":
    "Pembayaran diproses melalui penyedia pihak ketiga (Stripe dan FPX). Dengan melakukan pembayaran, Anda menyetujui syarat dan ketentuan penyedia tersebut.",
  "legal.terms.s7.escrow": "Escrow",
  "legal.terms.s7.escrowP":
    "Dana ditahan dalam escrow setelah perusahaan melakukan pembayaran untuk suatu milestone. Dana hanya dilepas ke penyedia layanan setelah perusahaan menyetujui milestone yang telah diselesaikan. Dana pada milestone yang disengketakan dapat dibekukan hingga penyelesaian (lihat Bagian 13).",
  "legal.terms.s7.fees": "Biaya Platform",
  "legal.terms.s7.feesP":
    "Biaya platform dapat berlaku untuk transaksi di TechConnex. Besaran biaya yang berlaku akan ditampilkan dengan jelas saat pembayaran. Biaya tidak dapat dikembalikan kecuali dinyatakan lain atau diwajibkan oleh hukum.",
  "legal.terms.s7.payout": "Pencairan Penyedia",
  "legal.terms.s7.payoutP":
    "Penyedia wajib mengirimkan detail pencairan yang valid (mis. rekening bank, PayPal, Payoneer, Wise, atau e-wallet) untuk menerima pembayaran. Waktu pemrosesan pencairan dapat berbeda tergantung metode pembayaran dan yurisdiksi.",
  "legal.terms.s7.lim": "Batasan",
  "legal.terms.s7.limP":
    "TechConnex tidak menyimpan detail kartu atau kredensial pembayaran secara penuh. TechConnex tidak bertanggung jawab atas kegagalan atau kesalahan yang disebabkan sistem pembayaran pihak ketiga. TechConnex tidak bertanggung jawab atas kerugian konversi mata uang atau biaya transfer internasional.",
  "legal.terms.s8.h": "8. Tonggak & Persetujuan Hasil Kerja",
  "legal.terms.s8.p":
    "Perusahaan harus meninjau dan merespons milestone yang telah selesai dalam waktu yang wajar. Proyek disusun berdasarkan milestone yang disepakati antara perusahaan dan penyedia. Setelah milestone selesai diserahkan, perusahaan harus meninjau dan menyetujui atau meminta revisi dalam jangka waktu yang wajar. Jika perusahaan tidak merespons dalam 14 hari kalender sejak penyerahan milestone, TechConnex berhak menganggap milestone disetujui dan melepas dana terkait. Persetujuan milestone merupakan penerimaan atas hasil kerja untuk milestone tersebut. Perusahaan dapat meminta revisi yang wajar sesuai ruang lingkup proyek yang disepakati.",
  "legal.terms.s9.h": "9. Pengembalian Dana & Pembatalan",
  "legal.terms.s9.p":
    "Pengembalian dana ditangani kasus per kasus melalui proses sengketa. Dana escrow untuk milestone yang belum disetujui dapat dikembalikan ke perusahaan jika penyedia gagal menyerahkan pekerjaan atau meninggalkan proyek. Biaya platform tidak dapat dikembalikan. Permintaan refund harus diajukan melalui proses sengketa platform (Bagian 13). TechConnex akan meninjau bukti dari kedua pihak sebelum menentukan hasil refund. Dalam pembatalan bersama yang disepakati kedua pihak, dana escrow akan dikembalikan ke perusahaan setelah dikurangi biaya yang berlaku. TechConnex berhak membuat keputusan akhir refund dalam kasus pembatalan yang disengketakan.",
  "legal.terms.s10.h": "10. Fitur Berbasis AI",
  "legal.terms.s10.short":
    "Fitur AI disediakan hanya sebagai bantuan dan tidak menggantikan pertimbangan manusia.",
  "legal.terms.s10.p":
    "TechConnex menggunakan kecerdasan buatan dan machine learning untuk: mencocokkan proyek dengan penyedia yang sesuai, serta peluang dengan perusahaan yang sesuai, dengan menghasilkan skor kecocokan dan penjelasan; membantu evaluasi dan peringkasan penawaran untuk mendukung pengambilan keputusan perusahaan; membantu penyedia menyusun profil profesional dan membantu perusahaan menulis deskripsi proyek berdasarkan dokumen yang diunggah; mendukung obrolan bantuan dalam platform yang mengambil dari dokumentasi platform dengan eskalasi ke agen manusia untuk pertanyaan kompleks. Batasan penting: keluaran AI hanya bersifat informatif dan bukan nasihat profesional. TechConnex tidak menjamin akurasi, kesesuaian, atau hasil dari rekomendasi maupun konten yang dihasilkan AI. Pengguna tetap bertanggung jawab penuh atas keputusan yang diambil berdasarkan keluaran AI. Anda tidak boleh mencoba memanipulasi, mengakali, atau mengeksploitasi sistem AI di platform. Jika pemrosesan berbasis AI menghasilkan keputusan berdampak signifikan pada akun Anda, Anda dapat meminta peninjauan manusia dengan menghubungi techconn@techconnex.vip. Fitur AI kami didukung penyedia pihak ketiga termasuk OpenAI dan Langchain. Penggunaan fitur ini tunduk pada syarat dan kebijakan masing-masing.",
  "legal.terms.s11.h": "11. Komunikasi & Konten",
  "legal.terms.s11.short":
    "Anda tetap memiliki konten Anda namun memberikan lisensi terbatas kepada TechConnex untuk mengoperasikan platform.",
  "legal.terms.s11.p":
    "Pengguna dapat bertukar pesan, file, dan lampiran melalui sistem perpesanan platform dan obrolan dukungan. Anda setuju untuk tidak mengunggah, membagikan, atau mengirim: konten ilegal, berbahaya, mencemarkan nama baik, atau penipuan; malware, virus, atau kode berbahaya; konten yang melanggar hak kekayaan intelektual apa pun; spam, komunikasi komersial tanpa diminta, atau konten phishing; konten yang melecehkan, mengancam, atau menyalahgunakan pihak mana pun. Anda tetap memiliki kepemilikan atas konten yang Anda buat dan unggah ke platform. Dengan menggunakan TechConnex, Anda memberikan kepada kami lisensi terbatas, non-eksklusif, bebas royalti untuk menampung, memproses, menampilkan, dan mengirimkan konten Anda semata-mata untuk tujuan mengoperasikan dan meningkatkan platform. Kami dapat mengirim komunikasi terkait layanan (mis. notifikasi pembayaran, pembaruan sengketa, perubahan kebijakan). Anda dapat menonaktifkan komunikasi pemasaran non-esensial melalui pengaturan akun.",
  "legal.terms.s12.h": "12. Kekayaan Intelektual",
  "legal.terms.s12.p":
    "TechConnex memiliki seluruh IP platform. Kepemilikan hasil kerja proyek ditentukan oleh perjanjian antara perusahaan dan penyedia. Seluruh hak kekayaan intelektual pada platform TechConnex — termasuk perangkat lunak, desain, merek, sistem AI, dan dokumentasi — dimiliki oleh atau dilisensikan kepada CYBERNET CONSULTING SDN. BHD. Tidak ada dalam Ketentuan ini yang memberikan Anda hak menggunakan kekayaan intelektual kami di luar yang diperlukan untuk menggunakan platform. Hak kekayaan intelektual atas hasil kerja proyek (produk kerja yang dibuat penyedia layanan untuk perusahaan) diatur oleh perjanjian antara perusahaan dan penyedia. TechConnex tidak memberikan pernyataan mengenai kepemilikan IP atas hasil kerja dan tidak bertanggung jawab atas sengketa akibat pengaturan IP yang tidak jelas antarpengguna. Pengguna dianjurkan menetapkan ketentuan kepemilikan dan lisensi IP secara jelas dalam perjanjian proyek mereka.",
  "legal.terms.s13.h": "13. Sengketa",
  "legal.terms.s13.short":
    "Pengguna harus terlebih dahulu mencoba menyelesaikan sengketa menggunakan alat platform. TechConnex dapat membantu peninjauan namun bukan arbiter hukum.",
  "legal.terms.s13.p":
    "Antarpengguna: Jika sengketa muncul antara perusahaan dan penyedia layanan, pengguna harus terlebih dahulu mencoba penyelesaian melalui perpesanan dan alat platform. Jika belum selesai, salah satu pihak dapat mengajukan sengketa formal melalui fungsi sengketa platform. Dana terkait milestone yang disengketakan dapat dibekukan selama masa peninjauan. Admin TechConnex dapat meninjau pesan, file, bukti, dan catatan milestone untuk membantu penyelesaian. TechConnex akan berupaya merespons sengketa dalam 10 hari kerja sejak diajukan. TechConnex tidak menjamin hasil sengketa tertentu dan tidak bertindak sebagai arbiter hukum; keputusannya tidak mengikat secara hukum. Masing-masing pihak tetap berhak menempuh upaya hukum melalui pengadilan yang berwenang. Sengketa dengan TechConnex: Setiap sengketa antara pengguna dan TechConnex diatur oleh hukum Malaysia (lihat Bagian 21). Kami mendorong penyelesaian melalui kontak langsung sebelum memulai proses formal.",
  "legal.terms.s14.h": "14. Aktivitas Terlarang",
  "legal.terms.s14.short":
    "Penyalahgunaan platform dapat mengakibatkan penangguhan langsung atau penghentian permanen.",
  "legal.terms.s14.p":
    "Anda tidak boleh menggunakan TechConnex untuk: memalsukan identitas, kualifikasi, atau kredensial Anda; mengakali, memanipulasi, atau mengeksploitasi sistem escrow atau pembayaran; terlibat dalam atau memfasilitasi transaksi penipuan; melecehkan, mengancam, mengintimidasi, atau menyalahgunakan pengguna mana pun atau staf TechConnex; mencoba memanipulasi, merekayasa balik, atau mengeksploitasi sistem AI TechConnex; scraping, memanen, atau mengekstrak data dari platform tanpa izin tertulis; memposting proyek palsu, spam penawaran, atau membuat akun pengguna palsu; melakukan aktivitas yang melanggar hukum Malaysia atau hukum internasional yang berlaku; mengajak pengguna bertransaksi di luar platform untuk menghindari biaya. Pelanggaran dapat menyebabkan penangguhan langsung, penghentian akun permanen, dan/atau tindakan hukum.",
  "legal.terms.s15.h": "15. Penangguhan & Penghentian Akun",
  "legal.terms.s15.short":
    "Kami dapat menangguhkan atau menghentikan akun untuk pelanggaran, penipuan, atau melindungi integritas platform.",
  "legal.terms.s15.p":
    "Kami dapat menangguhkan atau menghentikan akun Anda secara permanen, dengan atau tanpa pemberitahuan, untuk: pelanggaran terhadap ketentuan mana pun dalam Ketentuan ini; perilaku penipuan, menyesatkan, atau berbahaya; kegagalan menyelesaikan verifikasi KYC/identitas yang diwajibkan; kewajiban hukum atau persyaratan regulator; perlindungan integritas platform atau pengguna lain. Anda dapat meminta penutupan akun kapan saja dengan menghubungi techconn@techconnex.vip, dengan ketentuan: penyelesaian proyek, milestone, atau sengketa yang aktif; pelunasan pembayaran atau biaya yang masih tertunggak. Dampak penghentian: akses ke akun dan fitur platform akan berakhir; dana escrow tertunda akan ditangani sesuai status milestone aktif; kami dapat menyimpan data tertentu sebagaimana diwajibkan hukum atau Kebijakan Privasi kami.",
  "legal.terms.s16.h": "16. Batasan Tanggung Jawab",
  "legal.terms.s16.p":
    "Tanggung jawab TechConnex dibatasi pada biaya yang telah Anda bayarkan dalam 12 bulan sebelumnya. Sejauh diizinkan hukum yang berlaku: TechConnex disediakan dalam kondisi \"apa adanya\" dan \"sebagaimana tersedia\" tanpa jaminan apa pun, tersurat maupun tersirat. Kami tidak bertanggung jawab atas kerugian tidak langsung, insidental, konsekuensial, khusus, atau punitif yang timbul dari penggunaan platform oleh Anda. Kami tidak bertanggung jawab atas perilaku, konten, atau kinerja kontraktual pengguna mana pun. Kami tidak bertanggung jawab atas keputusan yang diambil berdasarkan rekomendasi atau konten yang dihasilkan AI. Kami tidak bertanggung jawab atas kegagalan, keterlambatan, atau kesalahan pada sistem pembayaran pihak ketiga. Total tanggung jawab agregat kami kepada Anda tidak akan melebihi total biaya yang Anda bayarkan kepada TechConnex dalam 12 bulan sebelum peristiwa yang menimbulkan klaim. Tidak ada dalam Ketentuan ini yang mengecualikan atau membatasi tanggung jawab atas penipuan, kelalaian berat, atau tanggung jawab apa pun yang tidak dapat dikecualikan atau dibatasi berdasarkan hukum Malaysia yang berlaku.",
  "legal.terms.s17.h": "17. Ganti Rugi",
  "legal.terms.s17.p":
    "Anda setuju untuk mengganti rugi TechConnex terhadap klaim yang timbul dari penggunaan platform oleh Anda atau pelanggaran Ketentuan ini. Anda setuju untuk mengganti rugi, membela, dan membebaskan CYBERNET CONSULTING SDN. BHD., pejabat, direktur, karyawan, dan agennya dari dan terhadap setiap klaim, kewajiban, kerugian, kerusakan, dan biaya (termasuk biaya hukum yang wajar) yang timbul dari atau terkait dengan: penggunaan Anda atas, atau ketidakmampuan Anda menggunakan, TechConnex; pelanggaran Anda terhadap Ketentuan ini atau hukum yang berlaku; pelanggaran Anda terhadap hak pihak ketiga, termasuk hak kekayaan intelektual atau privasi; konten atau hasil kerja yang Anda posting, ajukan, atau kirim melalui platform; setiap sengketa antara Anda dan pengguna lain.",
  "legal.terms.s18.h": "18. Keadaan Kahar",
  "legal.terms.s18.p":
    "TechConnex tidak bertanggung jawab atas kegagalan yang disebabkan kejadian di luar kendali wajar kami. TechConnex tidak dapat dimintai tanggung jawab atas keterlambatan, gangguan, atau kegagalan pelaksanaan akibat keadaan di luar kendali wajar kami, termasuk namun tidak terbatas pada: bencana alam, cuaca ekstrem, atau keadaan memaksa; tindakan pemerintah, hukum, peraturan, atau sanksi; serangan siber, peretasan, atau kegagalan sistem pihak ketiga; gangguan internet atau telekomunikasi; pandemi atau keadaan darurat kesehatan publik. Dalam kondisi tersebut, kami akan melakukan upaya wajar untuk memberi tahu pengguna terdampak dan memulihkan layanan sesegera mungkin.",
  "legal.terms.s19.h": "19. Privasi & Perlindungan Data",
  "legal.terms.s19.short":
    "Privasi Anda diatur oleh Kebijakan Privasi kami, yang merupakan bagian dari Ketentuan ini.",
  "legal.terms.s19.p1": "Penggunaan TechConnex oleh Anda juga diatur oleh ",
  "legal.terms.s19.p2":
    ", yang dimasukkan ke dalam Ketentuan ini melalui rujukan. Dengan menggunakan platform, Anda mengakui telah membaca dan memahami Kebijakan Privasi kami. Kami memproses data pribadi sesuai Undang-Undang Perlindungan Data Pribadi Malaysia 2010 (PDPA) dan standar perlindungan data internasional yang berlaku.",
  "legal.terms.s20.h": "20. Perubahan Ketentuan Ini",
  "legal.terms.s20.p":
    "Kami akan memberi tahu Anda atas perubahan material. Penggunaan berkelanjutan merupakan penerimaan atas Ketentuan yang diperbarui. Kami dapat memperbarui Ketentuan ini dari waktu ke waktu. Saat kami membuat perubahan material, kami akan memposting pemberitahuan di platform dan/atau mengirim notifikasi email ke pengguna terdaftar serta memperbarui tanggal \"Terakhir Diperbarui\" di bagian atas dokumen ini. Penggunaan berkelanjutan Anda atas TechConnex setelah tanggal berlaku Ketentuan yang diperbarui merupakan persetujuan Anda atas perubahan tersebut. Jika Anda tidak setuju dengan Ketentuan yang direvisi, Anda harus berhenti menggunakan platform.",
  "legal.terms.s21.h": "21. Hukum yang Mengatur & Penyelesaian Sengketa",
  "legal.terms.s21.p":
    "Ketentuan ini diatur oleh hukum Malaysia. Kami mendorong penyelesaian secara damai sebelum proses formal. Ketentuan ini diatur dan ditafsirkan sesuai hukum Malaysia, tanpa memperhatikan prinsip pertentangan hukum. Jika timbul sengketa dari atau terkait Ketentuan ini atau penggunaan TechConnex oleh Anda: kedua pihak setuju terlebih dahulu mencoba penyelesaian melalui negosiasi beritikad baik; jika tidak terselesaikan dalam 30 hari, sengketa akan dirujuk ke pengadilan Malaysia yang memiliki yurisdiksi eksklusif. Tidak ada dalam bagian ini yang mencegah TechConnex mencari perintah injunksi atau upaya hukum setara lainnya di yurisdiksi mana pun untuk melindungi kekayaan intelektual atau integritas platformnya.",
  "legal.terms.s22.h": "22. Informasi Kontak",
  "legal.terms.s22.p":
    "Untuk pertanyaan, kekhawatiran, atau pemberitahuan terkait Ketentuan ini, silakan hubungi kami:",
};

export const legalTermsId = { ...legalTermsEn, ...overrides };
