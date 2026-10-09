# راهنمای استقرار روی VPS ایرانی (Docker)

این راهنما برای زمانی است که می‌خواهید سایت را از Railway به یک سرور مجازی (VPS) در ایران ببرید. Railway تا آن موقع به کار خودش ادامه می‌دهد.

## ۱. خرید سرور

- نوع: VPS (نه هاست اشتراکی)، دیتاسنتر ایران
- سیستم‌عامل: Ubuntu 22.04 یا 24.04
- حداقل: ۲ هسته، ۲ گیگ رم (۴ گیگ بهتر است)، ۴۰ گیگ دیسک
- بعد از خرید، آی‌پی سرور و رمز root را می‌گیرید.

## ۲. تنظیم دامنه

در پنل نمایندگی دامنه دو رکورد بسازید:

| نوع | نام | مقدار |
|-----|-----|-------|
| A | @ | آی‌پی سرور |
| A | www | آی‌پی سرور |

TTL را کوتاه بگذارید (مثلاً ۳۰۰ ثانیه) تا اگر سرور عوض شد، تغییر سریع اثر کند.

## ۳. آماده‌سازی سرور

با SSH وارد شوید: `ssh root@IP`

```bash
apt update && apt install -y docker.io docker-compose-v2 git ufw
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw --force enable
```

اگر نصب Docker از مخزن اوبونتو نشد، از مخزن ایرانی همان نمایندگی استفاده کنید یا از پشتیبانی‌شان بپرسید.

## ۴. گرفتن کد و اجرا

```bash
git clone https://github.com/allocsys/clothes-shop.git
cd clothes-shop
cp .env.example .env
nano .env        # DOMAIN را با دامنه خودتان و POSTGRES_PASSWORD را با یک رمز قوی عوض کنید
docker compose up -d --build
```

چند دقیقه بعد سایت روی `https://دامنه‌شما` بالا می‌آید. گواهی HTTPS را Caddy خودش می‌گیرد و تمدید می‌کند.

اگر `git clone` از GitHub کار نکرد، پوشه پروژه را روی کامپیوتر خودتان zip کنید و با `scp` به سرور بفرستید.

## ۵. اگر Docker Hub یا npm از سرور باز نشد

از داخل ایران ممکن است Docker Hub یا npm محدود باشد. در فایل `.env` این سه خط را فعال کنید و آدرس یک آینه (mirror) معتبر را بگذارید (آدرس آینه را از مستندات نمایندگی یا یک آینه ایرانی بگیرید):

```
NODE_IMAGE=<mirror>/node:22-alpine
CADDY_IMAGE=<mirror>/caddy:2-alpine
NPM_REGISTRY=<npm-mirror-url>
```

راه دیگر: image را روی کامپیوتری که اینترنت آزاد دارد بسازید (`docker build`) و با `docker save` / `docker load` به سرور منتقل کنید.

## ۶. به‌روزرسانی سایت

```bash
cd clothes-shop
git pull
docker compose up -d --build
```

## ۷. دستورهای مفید

```bash
docker compose ps              # وضعیت سرویس‌ها
docker compose logs -f web     # لاگ سایت (سفارش‌ها با NEW_ORDER ثبت می‌شوند)
docker compose restart web     # راه‌اندازی دوباره
```

## دیتابیس و بکاپ

رمز دیتابیس را فقط با حرف و عدد بسازید. این دستور یکی می‌سازد: `openssl rand -hex 24`

جدول‌ها با هر `docker compose up` خودکار ساخته یا به‌روز می‌شوند. فقط بار اول، اگر محصولات نمونه را می‌خواهید:

```bash
docker compose run --rm migrate node scripts/seed.mjs
```

**بکاپ:**

```bash
sh scripts/backup.sh     # فایل فشرده در پوشه backups/ می‌سازد (۱۴ تای آخر را نگه می‌دارد)
```

برای بکاپ روزانه خودکار، `crontab -e` را باز کنید و این خط را بگذارید (مسیر را با مسیر پروژه‌تان عوض کنید):

```
0 3 * * * cd /root/clothes-shop && sh scripts/backup.sh >> backups/backup.log 2>&1
```

مهم: فایل‌های `backups/` را حتماً به جای دیگری هم کپی کنید (کامپیوتر خودتان یا سرور دیگر)، چون اگر خود سرور از بین برود بکاپ روی همان سرور هم از بین می‌رود.

**برگرداندن بکاپ:**

```bash
docker compose stop web
docker compose exec -T db sh -c 'dropdb -U "$POSTGRES_USER" "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'
gunzip -c backups/FILE.sql.gz | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'
docker compose start web
```

## یادداشت‌ها

- فعلاً سایت هنوز محصولات و سفارش‌ها را از دیتابیس نمی‌خواند و نمی‌نویسد. دیتابیس و جدول‌ها آماده‌اند و در قدم‌های بعدی سایت به آن وصل می‌شود. تا آن موقع سفارش‌ها فقط در لاگ ثبت می‌شوند.
- هیچ رمز یا کلیدی داخل Git نگذارید. همه چیز در فایل `.env` روی سرور می‌ماند.
