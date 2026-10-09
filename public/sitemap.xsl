<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="id">
      <head>
        <title>XML Sitemap — Fargan Digital Creative</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #030712;
            color: #F8FAFC;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: #0B132B;
            border: 1px solid rgba(0, 245, 255, 0.2);
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          }
          h1 {
            color: #FFFFFF;
            font-size: 24px;
            margin: 0 0 8px 0;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          p {
            color: #94A3B8;
            font-size: 14px;
            line-height: 1.6;
            margin: 0 0 24px 0;
          }
          .badge {
            display: inline-block;
            background: rgba(6, 182, 212, 0.15);
            color: #38BDF8;
            border: 1px solid rgba(6, 182, 212, 0.4);
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-family: monospace;
            font-weight: bold;
            margin-bottom: 16px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th {
            background-color: #111E38;
            color: #38BDF8;
            text-align: left;
            padding: 12px 14px;
            font-weight: 600;
            border-bottom: 2px solid rgba(0, 245, 255, 0.2);
          }
          td {
            padding: 12px 14px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            color: #E2E8F0;
          }
          tr:hover td {
            background-color: rgba(255, 255, 255, 0.03);
          }
          a {
            color: #38BDF8;
            text-decoration: none;
            font-weight: 500;
          }
          a:hover {
            text-decoration: underline;
            color: #67E8F9;
          }
          .footer {
            margin-top: 24px;
            font-size: 12px;
            color: #64748B;
            text-align: center;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="badge">GOOGLE SEARCH ENGINE SITEMAP</div>
          <h1>🌐 Fargan Digital Creative XML Sitemap</h1>
          <p>
            Peta situs resmi ini dibuat otomatis untuk membantu mesin telusur seperti <strong>Google</strong>, <strong>Bing</strong>, dan <strong>Yandex</strong> mengindeks seluruh halaman dan aset teknologi <a href="https://alfargan.com">alfargan.com</a> secara real-time.
          </p>
          <table>
            <thead>
              <tr>
                <th style="width: 55%;">URL Halaman</th>
                <th style="width: 15%;">Frekuensi</th>
                <th style="width: 15%;">Prioritas</th>
                <th style="width: 15%;">Terakhir Diperbarui</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                  </td>
                  <td><xsl:value-of select="sitemap:changefreq"/></td>
                  <td><strong style="color: #10B981;"><xsl:value-of select="sitemap:priority"/></strong></td>
                  <td><xsl:value-of select="substring(sitemap:lastmod, 1, 10)"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
          <div class="footer">
            © 2026 Fargan Digital Creative • https://alfargan.com
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
