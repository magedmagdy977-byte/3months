import { QuotationItem, ClientInfo } from '../types';
import { formatSAR, tafqeetSAR, formatNumber, getQuotationAreaDetails } from '../utils/formatters';
import {
  getActiveScopeItemsForQuotation,
  GENERAL_OWNER_OBLIGATIONS,
  EXCLUSION_CLAUSES,
  getPaymentMilestones,
} from '../data/masterTemplateDefaults';
import { getGoogleAccessToken } from './firebase';

export interface GoogleDocExportResult {
  documentId: string;
  url: string;
  title: string;
}

const cleanEngineerName = (name?: string) => {
  if (!name) return 'م.ماجد';
  const clean = name.replace(/^(م\.|م\/|م\s+)/, '').trim() || name;
  return `م. ${clean}`;
};

const formatProposalDetailedTitle = (clientInfo: ClientInfo) => {
  const service = (clientInfo.serviceType || '').trim();
  const building = (clientInfo.buildingType || '').trim();

  let servicePart = service;
  if (!servicePart) {
    servicePart = 'إصدار التراخيص والاستشارات الهندسية';
  }
  if (!servicePart.startsWith('أعمال')) {
    servicePart = `أعمال ${servicePart}`;
  }

  let buildingPart = building || 'فيلا سكنية';
  if (!buildingPart.startsWith('لمشروع') && !buildingPart.startsWith('مشروع')) {
    buildingPart = `لمشروع ${buildingPart}`;
  } else if (buildingPart.startsWith('مشروع')) {
    buildingPart = `ل${buildingPart}`;
  }

  const isDefaultVillaTitle =
    clientInfo.projectTitle === 'مشروع فيلا سكنية خاصة' ||
    clientInfo.projectTitle === 'مشروع فيلا سكنية' ||
    clientInfo.projectTitle === 'فيلا سكنية خاصة';

  if (
    clientInfo.projectTitle &&
    clientInfo.projectTitle.trim().length > 3 &&
    !isDefaultVillaTitle &&
    clientInfo.projectTitle.trim() !== `مشروع ${building}`
  ) {
    let custom = clientInfo.projectTitle.trim();
    if (!custom.startsWith('أعمال') && !custom.startsWith('مشروع') && !custom.startsWith('لمشروع')) {
      custom = `أعمال ${custom}`;
    }
    return custom;
  }

  return `${servicePart} ${buildingPart}`;
};

export function generateQuotationHtml(clientInfo: ClientInfo, items: QuotationItem[]): string {
  const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0);

  let discountAmount = 0;
  if (clientInfo.discountType === 'percentage') {
    discountAmount = Math.round((subtotal * (clientInfo.discountValue || 0)) / 100);
  } else {
    discountAmount = clientInfo.discountValue || 0;
  }
  discountAmount = Math.min(discountAmount, subtotal);

  const amountAfterDiscount = subtotal - discountAmount;
  const taxAmount = clientInfo.includeTax ? Math.round(amountAfterDiscount * 0.15) : 0;
  const grandTotal = amountAfterDiscount + taxAmount;

  const activeScopeItems = getActiveScopeItemsForQuotation(clientInfo, items);
  const areaDetails = getQuotationAreaDetails(clientInfo, items);
  const milestones = getPaymentMilestones(clientInfo.paymentScheduleType, grandTotal, clientInfo.customMilestones);

  const activeExclusions: string[] = [];
  if (clientInfo.exclusions?.excludeGovFees) {
    activeExclusions.push(EXCLUSION_CLAUSES.excludeGovFees);
  }
  if (clientInfo.exclusions?.customExclusions?.trim()) {
    activeExclusions.push(clientInfo.exclusions.customExclusions.trim());
  }

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>عرض سعر معتمد - ${clientInfo.proposalNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    body {
      font-family: 'Cairo', Arial, Tahoma, sans-serif;
      line-height: 1.45;
      color: #1a1a1a;
      direction: rtl;
      margin: 12px;
      background: #ffffff;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2px solid #2d2a4a;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .header-table td {
      border: none;
      padding: 2px 4px;
      vertical-align: middle;
    }
    .company-title {
      font-size: 18px;
      font-weight: 900;
      color: #2d2a4a;
      margin: 0;
    }
    .company-subtitle {
      font-size: 11px;
      color: #e37725;
      font-weight: bold;
      margin-top: 1px;
    }
    .company-creds {
      font-size: 9.5px;
      color: #666666;
      margin-top: 2px;
    }
    .proposal-meta {
      text-align: left;
      font-size: 10.5px;
      color: #444444;
      line-height: 1.35;
    }
    .proposal-meta strong {
      color: #111111;
    }
    .title-banner {
      text-align: center;
      padding: 6px;
      border-bottom: 1px solid #d0d0d0;
      margin-bottom: 8px;
    }
    .main-title {
      font-size: 18px;
      font-weight: 900;
      color: #2d2a4a;
      margin: 0;
    }
    .sub-title {
      font-size: 13px;
      font-weight: bold;
      color: #1a1a1a;
      margin-top: 2px;
    }
    .section-header {
      font-size: 11.5px;
      font-weight: 900;
      color: #2d2a4a;
      border-right: 4px solid #e37725;
      padding-right: 6px;
      margin-top: 8px;
      margin-bottom: 4px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #cccccc;
      padding: 4px 7px;
      font-size: 10.5px;
      text-align: right;
      vertical-align: top;
    }
    table.data-table th {
      background-color: #2d2a4a;
      color: #ffffff;
      font-weight: bold;
    }
    .info-label {
      background-color: #f3f4f6;
      font-weight: bold;
      color: #2d2a4a;
      width: 15%;
      font-size: 10px;
    }
    .intro-box {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 7px 10px;
      border-radius: 6px;
      font-size: 10.5px;
      line-height: 1.5;
      text-align: justify;
      margin-bottom: 8px;
    }
    .total-row {
      background-color: #2d2a4a !important;
      color: #ffffff !important;
      font-weight: 900 !important;
      font-size: 11.5px !important;
    }
    .total-row td {
      color: #ffffff !important;
    }
    .tafqeet-box {
      background-color: #fef3c7;
      border: 1px solid #fde68a;
      padding: 5px 8px;
      border-radius: 6px;
      font-size: 10.5px;
      font-weight: bold;
      color: #92400e;
      margin-top: 4px;
    }
    .bank-box {
      border: 1px solid #d1d5db;
      background-color: #f9fafb;
      padding: 6px 8px;
      border-radius: 6px;
      margin-top: 4px;
      font-size: 10px;
      line-height: 1.4;
    }
    .bank-box .iban {
      font-family: monospace;
      font-size: 11px;
      font-weight: bold;
      color: #e37725;
      margin-top: 2px;
    }
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      border-top: 2px solid #cccccc;
      padding-top: 8px;
    }
    .signatures-table td {
      border: none;
      vertical-align: top;
      width: 50%;
      padding: 4px 6px;
      font-size: 10.5px;
    }
    .doc-footer {
      text-align: center;
      font-size: 9px;
      color: #888888;
      border-top: 1px solid #e5e7eb;
      padding-top: 4px;
      margin-top: 8px;
    }
  </style>
</head>
<body>

  <!-- LETTERHEAD -->
  <table class="header-table">
    <tr>
      <td style="width: 68%;">
        <h1 class="company-title">مجموعة شركات الرؤية المضيئة للاستشارات الهندسية والتصميم</h1>
        <div class="company-subtitle">LUMINOUS VISION Engineering & Design Consultancy</div>
        <div class="company-creds">
          تصميم معماري وإنشائي وكهروميكانيكي • كود البناء السعودي SBC • رخص بلدي • إشراف هندسي • دفاع مدني
        </div>
      </td>
      <td style="width: 32%;" class="proposal-meta">
        <div>رقم العرض: <strong>${clientInfo.proposalNumber}</strong></div>
        <div>التاريخ: <strong>${clientInfo.date}</strong></div>
        <div>إعداد المهندس: <strong>${cleanEngineerName(clientInfo.preparedBy)}</strong></div>
        <div style="color: #e37725; font-weight: bold;">صلاحية العرض: ${clientInfo.validityDays || 30} يوماً</div>
      </td>
    </tr>
  </table>

  <!-- PROMINENT PROPOSAL TITLE -->
  <div class="title-banner">
    <h2 class="main-title">عرض سعر</h2>
    <div class="sub-title">${formatProposalDetailedTitle(clientInfo)}</div>
  </div>

  <!-- أولًا: بيانات العرض والمشروع -->
  <div class="section-header">أولًا: بيانات العرض والمشروع</div>
  <table class="data-table">
    <tr>
      <td class="info-label">رقم العرض:</td>
      <td><strong>${clientInfo.proposalNumber}</strong></td>
      <td class="info-label">التاريخ:</td>
      <td><strong>${clientInfo.date}</strong></td>
      <td class="info-label">اسم العميل:</td>
      <td><strong>${clientInfo.clientName || 'العميل الكريم'}</strong></td>
    </tr>
    <tr>
      <td class="info-label">نوع المبنى:</td>
      <td><strong>${clientInfo.buildingType}</strong></td>
      <td class="info-label">المدينة / الحي:</td>
      <td><strong>${clientInfo.projectCity} - ${clientInfo.district || 'غير محدد'}</strong></td>
      <td class="info-label">القطعة / المخطط:</td>
      <td>${clientInfo.plotNumber || '-'} / ${clientInfo.planNumber || '-'}</td>
    </tr>
    <tr>
      <td class="info-label">${areaDetails.label}</td>
      <td><strong>${areaDetails.value}</strong></td>
      <td class="info-label">نوع الخدمة:</td>
      <td colspan="3"><strong>${clientInfo.serviceType}</strong></td>
    </tr>
  </table>

  <!-- ثانيًا: مقدمة العرض -->
  <div class="section-header">ثانيًا: مقدمة العرض</div>
  <div class="intro-box">
    السيد/ <strong style="color: #433c71;">${clientInfo.clientName || 'العميل المحترم'}</strong> المحترم،
    بناءً على طلبكم، يسر شركة <strong>الرؤية المضيئة للاستشارات الهندسية</strong> أن تقدم لسعادتكم عرض السعر الخاص بأعمال 
    <strong>${clientInfo.serviceType}</strong> لمشروع <strong>${clientInfo.buildingType}</strong>، والكائن بمدينة 
    <strong>${clientInfo.projectCity}</strong>، حي <strong>${clientInfo.district || 'الموضح أعلاه'}</strong>، على قطعة الأرض رقم 
    <strong>${clientInfo.plotNumber || '—'}</strong> من المخطط رقم <strong>${clientInfo.planNumber || '—'}</strong>، 
    <strong>${areaDetails.introText}</strong>، وذلك وفق نطاق الأعمال والشروط الموضحة أدناه.
  </div>

  <!-- ثالثًا: نطاق أعمال الاستشاري المعتمد (شبكي عمودين لملء الصفحة بتناسق) -->
  <div class="section-header">ثالثًا: نطاق أعمال الاستشاري المعتمد (${activeScopeItems.length} وحدات هندسية مشمولة)</div>
  <table class="data-table">
    <tbody>
      ${(() => {
        const rows: string[] = [];
        for (let i = 0; i < activeScopeItems.length; i += 2) {
          const first = activeScopeItems[i];
          const second = activeScopeItems[i + 1];
          if (second) {
            rows.push(`
              <tr>
                <td style="width: 50%; background-color: #f9fafb;">
                  <strong style="color: #433c71;">${i + 1}. ${first.name}:</strong>
                  <div style="color: #333333; font-size: 10px; margin-top: 2px;">${first.description}</div>
                </td>
                <td style="width: 50%; background-color: #f9fafb;">
                  <strong style="color: #433c71;">${i + 2}. ${second.name}:</strong>
                  <div style="color: #333333; font-size: 10px; margin-top: 2px;">${second.description}</div>
                </td>
              </tr>
            `);
          } else {
            rows.push(`
              <tr>
                <td colspan="2" style="background-color: #f9fafb;">
                  <strong style="color: #433c71;">${i + 1}. ${first.name}:</strong>
                  <div style="color: #333333; font-size: 10px; margin-top: 2px;">${first.description}</div>
                </td>
              </tr>
            `);
          }
        }
        return rows.join('');
      })()}
    </tbody>
  </table>

  <!-- رابعًا: الشروط والالتزامات العامة والتنفيذية -->
  <div class="section-header">رابعًا: الشروط والالتزامات العامة والتنفيذية</div>
  <table class="data-table">
    <tr>
      <td style="width: 50%; background-color: #f9fafb;">
        <div style="font-weight: bold; color: #2d2a4a; margin-bottom: 3px;">التزامات المالك والأعمال المستثناة:</div>
        <div style="font-size: 10px; line-height: 1.45;">
          • ${GENERAL_OWNER_OBLIGATIONS[0]}<br>
          • ${GENERAL_OWNER_OBLIGATIONS[1]}<br>
          • ${GENERAL_OWNER_OBLIGATIONS[2]}<br>
          ${
            !clientInfo.scopeFlags?.supervision ||
            clientInfo.exclusions?.excludeSupervision ||
            !items.some(
              (i) =>
                i.departmentId === 'supervision' ||
                i.details.some(
                  (d) =>
                    d.includes('خدمة الإشراف:') &&
                    !d.includes('بدون خدمة إشراف') &&
                    !d.includes('بدون إشراف')
                )
            )
              ? `• <strong>تأكيد (بدون إشراف):</strong> لا يشمل نطاق الأعمال الإشراف الهندسي الميداني على التنفيذ.<br>`
              : ''
          }
          ${clientInfo.exclusions?.excludeGovFees ? `• <strong>مستثنى:</strong> ${EXCLUSION_CLAUSES.excludeGovFees}<br>` : ''}
          ${clientInfo.exclusions?.customExclusions?.trim() ? `• <strong>مستثنى:</strong> ${clientInfo.exclusions.customExclusions.trim()}` : ''}
        </div>
      </td>
      <td style="width: 50%; background-color: #f9fafb;">
        <div style="font-weight: bold; color: #2d2a4a; margin-bottom: 3px;">المدد الزمنية والتعديلات والملكية الفكرية:</div>
        <div style="font-size: 10px; line-height: 1.45;">
          • <strong>مدة التنفيذ:</strong> ${clientInfo.executionDurationDays || 45} يوم عمل من سداد الدفعة واعتماد المخططات المعمارية والواجهات.<br>
          • <strong>الاعتمادات:</strong> ${clientInfo.revisionCountText || 'تعديلان (2)'}، ويعتمد كل طور قبل التالي.<br>
          • <strong>الملكية الفكرية:</strong> المخرجات الهندسية تخضع لحقوق الاستخدام لموقع المشروع حصراً.
        </div>
      </td>
    </tr>
  </table>

  <!-- خامسًا وسادسًا جنباً إلى جنب في صفحة واحدة -->
  <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 4px;">
    <tr>
      <td style="width: 58%; border: none; padding: 0 0 0 8px; vertical-align: top;">
        <div class="section-header" style="margin-top: 2px;">خامسًا: الأسعار والبيان المالي</div>
        <table class="data-table" style="margin-bottom: 4px;">
          <tr>
            <td style="font-weight: bold;">أتعاب أعمال ${clientInfo.serviceType}:</td>
            <td style="text-align: left; font-weight: bold; width: 32%;">${formatSAR(subtotal)}</td>
          </tr>
          ${
            discountAmount > 0
              ? `<tr style="background-color: #fef2f2; color: #dc2626;">
            <td style="font-weight: bold;">الخصم التجاري الممنوح (${
              clientInfo.discountType === 'percentage' ? `${clientInfo.discountValue}%` : 'خاص'
            }):</td>
            <td style="text-align: left; font-weight: bold;">- ${formatSAR(discountAmount)}</td>
          </tr>`
              : ''
          }
          ${
            clientInfo.includeTax
              ? `<tr>
            <td>ضريبة القيمة المضافة المستحقة (15%):</td>
            <td style="text-align: left; font-weight: bold;">${formatSAR(taxAmount)}</td>
          </tr>`
              : `<tr style="background-color: #f9fafb;">
            <td colspan="2" style="font-size: 9.5px; color: #666666;">* الأسعار أعلاه غير شاملة ضريبة القيمة المضافة</td>
          </tr>`
          }
          <tr class="total-row">
            <td>الإجمالي النهائي ${clientInfo.includeTax ? 'شامل الضريبة' : ''}:</td>
            <td style="text-align: left; color: #fcd34d;">${formatSAR(grandTotal)}</td>
          </tr>
        </table>
        <div class="tafqeet-box">
          المبلغ كتابةً: <strong>${tafqeetSAR(grandTotal)}</strong>
        </div>
      </td>

      <td style="width: 42%; border: none; padding: 0 8px 0 0; vertical-align: top;">
        <div class="section-header" style="margin-top: 2px;">سادسًا: جدول الدفعات والبنك</div>
        <table class="data-table" style="margin-bottom: 4px;">
          ${milestones
            .map(
              (m) => `
            <tr>
              <td style="font-weight: bold;">${m.title}</td>
              <td style="text-align: left; font-weight: bold; color: #433c71;">${formatSAR(m.amount)}</td>
            </tr>`
            )
            .join('')}
        </table>
        <div class="bank-box">
          <div><strong>البنك:</strong> ${clientInfo.bankDetails?.bankName || 'البنك السعودي للاستثمار'} (${clientInfo.bankDetails?.accountName || 'شركة مجموعة الرؤية المضيئة للاستشارات الهندسية'})</div>
          <div class="iban">IBAN: ${clientInfo.bankDetails?.iban || '-'}</div>
          <div style="font-size: 9.5px; color: #92400e; font-weight: bold;">صلاحية العرض: ${clientInfo.validityDays || 30} يوماً من تاريخ إصداره.</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- سابعًا: الاعتمادات والتوقيعات والختم المعتمد -->
  <table class="signatures-table">
    <tr>
      <td>
        <div style="font-size: 11.5px; font-weight: 900; color: #1a1a1a; margin-bottom: 4px;">اعتماد وقبول العميل:</div>
        <div>الاسم: ....................................................</div>
        <div style="margin-top: 3px;">التوقيع: ..................................................</div>
        <div style="margin-top: 3px;">التاريخ: ..... / ..... / 2026 م</div>
      </td>
      <td style="text-align: left;">
        <div style="font-size: 11.5px; font-weight: 900; color: #433c71; margin-bottom: 4px;">اعتماد شركة الرؤية المضيئة للاستشارات الهندسية:</div>
        <div>إعداد المهندس: <strong>${cleanEngineerName(clientInfo.preparedBy)}</strong></div>
        <div style="margin-top: 4px;">
          <img src="/official-seal.png" alt="الختم المعتمد" style="height: 55px; width: auto;" onerror="this.style.display='none'" />
        </div>
      </td>
    </tr>
  </table>

  <!-- FOOTER -->
  <div class="doc-footer">
    مجموعة شركات الرؤية المضيئة للاستشارات الهندسية والتصميم • عرض سعر رقم ${clientInfo.proposalNumber} • س.ت: 1010788646 • وثيقة عرض سعر معتمدة رسمياً
  </div>

</body>
</html>`;
}

/**
 * Creates an editable Google Doc, sets public edit link sharing ("anyone with link is editor"),
 * and returns the Google Docs direct URL.
 */
export async function createAndShareGoogleDocQuotation(
  clientInfo: ClientInfo,
  items: QuotationItem[]
): Promise<GoogleDocExportResult> {
  const accessToken = await getGoogleAccessToken();
  const docTitle = `عرض سعر - ${clientInfo.clientName || 'العميل'} - ${clientInfo.proposalNumber}`;
  const htmlContent = generateQuotationHtml(clientInfo, items);

  let documentId = '';

  // 1. Try Drive API Multipart Upload with automatic HTML-to-Docs conversion
  try {
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: docTitle,
      mimeType: 'application/vnd.google-apps.document',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
      htmlContent +
      closeDelimiter;

    const createRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (createRes.ok) {
      const data = await createRes.json();
      documentId = data.id;
    } else {
      console.warn('Multipart upload returned status:', createRes.status);
    }
  } catch (err) {
    console.warn('Multipart conversion failed, attempting Docs API fallback:', err);
  }

  // 2. Fallback to direct Docs API creation if multipart failed
  if (!documentId) {
    const createDocRes = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: docTitle,
      }),
    });

    if (!createDocRes.ok) {
      const errBody = await createDocRes.text();
      throw new Error(`تعذر إنشاء مستند Google Docs: ${createDocRes.status} ${errBody}`);
    }

    const docData = await createDocRes.json();
    documentId = docData.documentId;

    // Insert structured text into the new document
    const textContent = buildPlainTextQuotation(clientInfo, items);
    await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: textContent,
            },
          },
        ],
      }),
    });
  }

  // 3. Set permission: Anyone with link can EDIT
  try {
    const permRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${documentId}/permissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'writer',
          type: 'anyone',
          allowFileDiscovery: false,
        }),
      }
    );

    if (!permRes.ok) {
      console.warn('Failed to set public edit permission:', await permRes.text());
    }
  } catch (permErr) {
    console.error('Error setting public permissions on document:', permErr);
  }

  const directEditUrl = `https://docs.google.com/document/d/${documentId}/edit`;

  return {
    documentId,
    url: directEditUrl,
    title: docTitle,
  };
}

function buildPlainTextQuotation(clientInfo: ClientInfo, items: QuotationItem[]): string {
  const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0);
  let discountAmount = 0;
  if (clientInfo.discountType === 'percentage') {
    discountAmount = Math.round((subtotal * (clientInfo.discountValue || 0)) / 100);
  } else {
    discountAmount = clientInfo.discountValue || 0;
  }
  discountAmount = Math.min(discountAmount, subtotal);
  const amountAfterDiscount = subtotal - discountAmount;
  const taxAmount = clientInfo.includeTax ? Math.round(amountAfterDiscount * 0.15) : 0;
  const grandTotal = amountAfterDiscount + taxAmount;
  const activeScopeItems = getActiveScopeItemsForQuotation(clientInfo, items);
  const milestones = getPaymentMilestones(clientInfo.paymentScheduleType, grandTotal, clientInfo.customMilestones);

  return [
    `مجموعة شركات الرؤية المضيئة للاستشارات الهندسية والتصميم`,
    `LUMINOUS VISION Engineering & Design Consultancy`,
    `عرض سعر معتمد — النموذج الهندسي الموحد`,
    `رقم العرض: ${clientInfo.proposalNumber} | التاريخ: ${clientInfo.date} | إعداد المهندس: ${cleanEngineerName(clientInfo.preparedBy)}`,
    `----------------------------------------------------------------------`,
    `عنوان العرض: ${formatProposalDetailedTitle(clientInfo)}`,
    `----------------------------------------------------------------------`,
    `أولًا: بيانات العرض والمشروع:`,
    `- اسم العميل: ${clientInfo.clientName || 'العميل الكريم'}`,
    `- رقم الهوية / السجل: ${clientInfo.nationalId || '-'}`,
    `- رقم الجوال: ${clientInfo.phone || '-'}`,
    `- نوع المبنى: ${clientInfo.buildingType}`,
    `- الموقع: ${clientInfo.projectCity} - ${clientInfo.district || ''}`,
    `- القطعة: ${clientInfo.plotNumber || '-'} | المخطط: ${clientInfo.planNumber || '-'}`,
    `- مساحة الأرض: ${formatNumber(clientInfo.landArea || 0)} م² ${clientInfo.buildingArea ? `| مسطح البناء المقدر: ${formatNumber(clientInfo.buildingArea)} م²` : ''}`,
    `- نوع الخدمة: ${clientInfo.serviceType}`,
    `----------------------------------------------------------------------`,
    `ثانيًا: مقدمة العرض والخطاب الرسمي:`,
    `السيد/ ${clientInfo.clientName || 'العميل المحترم'} المحترم،`,
    `بناءً على طلبكم، يسر شركة الرؤية المضيئة للاستشارات الهندسية أن تقدم لسعادتكم عرض السعر الخاص بأعمال ${clientInfo.serviceType} لمشروع ${clientInfo.buildingType}، والكائن بمدينة ${clientInfo.projectCity}، حي ${clientInfo.district || 'الموضح أعلاه'}، على قطعة الأرض رقم ${clientInfo.plotNumber || '—'} من المخطط رقم ${clientInfo.planNumber || '—'}، والبالغ إجمالي مساحة أرض المشروع ${formatNumber(clientInfo.landArea || 0)} م²، وفق نطاق الأعمال والشروط الموضحة أدناه.`,
    `----------------------------------------------------------------------`,
    `ثالثًا: نطاق أعمال الاستشاري المعتمد (${activeScopeItems.length} وحدات):`,
    ...activeScopeItems.map((s, idx) => `${idx + 1}. ${s.name}:\n   ${s.description}`),
    `----------------------------------------------------------------------`,
    items.length > 0 ? `رابعًا: جدول البنود والخدمات المسعرة:\n` + items.map((i, idx) => `${idx + 1}. ${i.title} [${i.departmentName}] - ${formatSAR(i.totalPrice)}`).join('\n') : '',
    `----------------------------------------------------------------------`,
    `خامسًا: الأسعار والبيان المالي والضريبي:`,
    `- المجموع قبل الخصم: ${formatSAR(subtotal)}`,
    discountAmount > 0 ? `- الخصم التجاري الممنوح: - ${formatSAR(discountAmount)}` : '',
    `- الإجمالي الخاضع للضريبة: ${formatSAR(amountAfterDiscount)}`,
    clientInfo.includeTax ? `- ضريبة القيمة المضافة 15%: ${formatSAR(taxAmount)}` : `- الأسعار أعلاه غير شاملة ضريبة القيمة المضافة`,
    `- الإجمالي النهائي الصافي: ${formatSAR(grandTotal)}`,
    `- المبلغ كتابةً وتفقيطاً: ${tafqeetSAR(grandTotal)}`,
    `----------------------------------------------------------------------`,
    `سادسًا: جدول سداد الدفعات المالية والتعاقدية:`,
    ...milestones.map((m) => `- ${m.title} (${m.percentage}%): ${formatSAR(m.amount)} — ${m.description}`),
    `----------------------------------------------------------------------`,
    `سابعًا: الشروط والالتزامات العامة والتنفيذية:`,
    `- تزويد الاستشاري بالمستندات (الصك المحدث، القرار المساحي، فحص التربة).`,
    `- سداد الرسوم الحكومية ورسوم المنصات (بلدي، التأمين، إلخ) وهي غير مشمولة بالأتعاب.`,
    `- مدة التنفيذ: ${clientInfo.executionDurationDays || 45} يوم عمل ${clientInfo.startDateNotice && !clientInfo.startDateNotice.includes('اعتماد الفكرة المعمارية') ? clientInfo.startDateNotice : 'من سداد الدفعة واعتماد المخططات المعمارية والواجهات'}.`,
    `- التعديلات والاعتمادات: ${clientInfo.revisionCountText}`,
    `- الملكية الفكرية: المخرجات خاضعة لحقوق الاستخدام لموقع المشروع حصراً.`,
    `----------------------------------------------------------------------`,
    `ثامنًا: بيانات الحساب البنكي الرسمي:`,
    `- البنك: ${clientInfo.bankDetails?.bankName || 'مصرف الراجحي'}`,
    `- اسم الحساب: ${clientInfo.bankDetails?.accountName || 'شركة مجموعة الرؤية المضيئة للاستشارات الهندسية'}`,
    `- IBAN: ${clientInfo.bankDetails?.iban || '-'}`,
    `- صلاحية العرض: ${clientInfo.validityDays || 30} يوماً من تاريخ إصداره.`,
    `----------------------------------------------------------------------`,
    `تاسعًا: التوقيعات والاعتماد:`,
    `اعتماد وقبول العميل: .......................................`,
    `اعتماد شركة الرؤية المضيئة للاستشارات الهندسية: ${cleanEngineerName(clientInfo.preparedBy)}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Copies the rich formatted quotation HTML and text to the clipboard so it can be pasted into any Google Doc with full formatting.
 */
export async function copyQuotationToClipboardForGoogleDocs(
  clientInfo: ClientInfo,
  items: QuotationItem[]
): Promise<boolean> {
  const html = generateQuotationHtml(clientInfo, items);
  const plainText = buildPlainTextQuotation(clientInfo, items);

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        }),
      ]);
      return true;
    }
  } catch (err) {
    console.warn('Rich clipboard write failed, trying text fallback:', err);
  }

  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(plainText);
      return true;
    }
  } catch (err) {
    console.warn('Text clipboard write failed:', err);
  }

  return false;
}

/**
 * Opens a brand new Google Doc directly inside the user's logged-in Gmail account (via docs.new)
 * and copies the entire formatted quotation HTML and tables to clipboard for instant pasting.
 * Works for ANY person on ANY device without any OAuth popups or permission blocks!
 */
export async function openGoogleDocsInUserAccount(
  clientInfo: ClientInfo,
  items: QuotationItem[]
): Promise<boolean> {
  const copied = await copyQuotationToClipboardForGoogleDocs(clientInfo, items);
  window.open('https://docs.new', '_blank');
  return copied;
}
