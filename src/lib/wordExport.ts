import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  ImageRun,
} from 'docx';
import { QuotationItem, ClientInfo, ContractData, DocumentOutputBundle } from '../types';
import { formatSAR, tafqeetSAR, formatNumber, getQuotationAreaDetails, generatePdfFileName } from '../utils/formatters';
import {
  getActiveScopeItemsForQuotation,
  GENERAL_OWNER_OBLIGATIONS,
  EXCLUSION_CLAUSES,
  getPaymentMilestones,
} from '../data/masterTemplateDefaults';
import {
  formatContractDisplayDate,
  resolveActiveContractData,
} from '../data/smartContractEngine';

const cleanEngineerName = (name?: string) => {
  if (!name) return 'م. ماجد';
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

// Helper to fetch image asset as ArrayBuffer in browser
async function fetchImageBuffer(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    return new Uint8Array(arrayBuf);
  } catch {
    return null;
  }
}

export async function generateWordDocumentBlob(
  clientInfo: ClientInfo,
  items: QuotationItem[],
  bundleMode?: DocumentOutputBundle
): Promise<Blob> {
  const effectiveBundle: DocumentOutputBundle =
    bundleMode || (clientInfo.contractData?.enabled ? 'quote_and_contract' : 'quote_only');
  // Financial computations (exact match to QuotationPrintView)
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

  // Active conditional scope units
  const activeScopeItems = getActiveScopeItemsForQuotation(clientInfo, items);

  // Exact context-aware area details matching active department
  const areaDetails = getQuotationAreaDetails(clientInfo, items);

  // Active milestones
  const milestones = getPaymentMilestones(clientInfo.paymentScheduleType, grandTotal, clientInfo.customMilestones);

  // Border styling
  const thinBorder = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: 'CCCCCC',
  };
  const cellBorders = {
    top: thinBorder,
    bottom: thinBorder,
    left: thinBorder,
    right: thinBorder,
  };
  const noBorder = {
    style: BorderStyle.NONE,
    size: 0,
    color: 'FFFFFF',
  };
  const cellNoBorders = {
    top: noBorder,
    bottom: noBorder,
    left: noBorder,
    right: noBorder,
  };

  // Pre-load images if available in browser
  const [logoBuffer, sealBuffer] = await Promise.all([
    fetchImageBuffer('/apple-touch-icon.png'),
    fetchImageBuffer('/official-seal.png'),
  ]);

  // Standard section header creator matching official brand (compact single-page spacing)
  const createSectionHeader = (title: string, badge?: string) => {
    return new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      spacing: { before: 80, after: 40 },
      children: [
        new TextRun({
          text: '▌ ',
          bold: true,
          size: 19,
          color: 'E37725',
        }),
        new TextRun({
          text: title,
          bold: true,
          size: 19,
          color: '433C71',
        }),
        ...(badge
          ? [
              new TextRun({
                text: `  (${badge})`,
                size: 15,
                color: '666666',
              }),
            ]
          : []),
      ],
    });
  };

  // --- 1. LETTERHEAD TABLE (الترويسة الرسمية) ---
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellNoBorders,
    rows: [
      new TableRow({
        children: [
          // Logo column (Right)
          new TableCell({
            width: { size: 12, type: WidthType.PERCENTAGE },
            borders: cellNoBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                children: [
                  logoBuffer
                    ? new ImageRun({
                        data: logoBuffer,
                        transformation: { width: 48, height: 48 },
                        type: 'png',
                      })
                    : new TextRun({ text: '✦', bold: true, size: 32, color: '433C71' }),
                ],
              }),
            ],
          }),

          // Company name & info (Center)
          new TableCell({
            width: { size: 58, type: WidthType.PERCENTAGE },
            borders: cellNoBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                children: [
                  new TextRun({
                    text: 'مجموعة شركات الرؤية المضيئة للاستشارات الهندسية والتصميم',
                    bold: true,
                    size: 21,
                    color: '433C71',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                children: [
                  new TextRun({
                    text: 'LUMINOUS VISION Engineering & Design Consultancy',
                    bold: true,
                    size: 15,
                    color: 'E37725',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                children: [
                  new TextRun({
                    text: 'تصميم معماري وإنشائي وكهروميكانيكي • كود البناء السعودي SBC • رخص بلدي • إشراف هندسي • دفاع مدني',
                    size: 14,
                    color: '666666',
                  }),
                ],
              }),
            ],
          }),

          // Quotation metadata (Left)
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            borders: cellNoBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                bidirectional: true,
                children: [
                  new TextRun({ text: 'رقم العرض: ', size: 15, color: '666666' }),
                  new TextRun({ text: clientInfo.proposalNumber, bold: true, size: 16, color: '1A1A1A' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                bidirectional: true,
                children: [
                  new TextRun({ text: 'التاريخ: ', size: 15, color: '666666' }),
                  new TextRun({ text: clientInfo.date, bold: true, size: 15, color: '1A1A1A' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                bidirectional: true,
                children: [
                  new TextRun({ text: 'إعداد المهندس: ', size: 15, color: '666666' }),
                  new TextRun({ text: cleanEngineerName(clientInfo.preparedBy), bold: true, size: 15, color: '433C71' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                bidirectional: true,
                children: [
                  new TextRun({
                    text: `صلاحية العرض: ${clientInfo.validityDays || 30} يوماً`,
                    bold: true,
                    size: 15,
                    color: 'E37725',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // --- 2. PROMINENT PROPOSAL TITLE (عرض سعر رسمي) ---
  const proposalTitleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    bidirectional: true,
    spacing: { before: 40, after: 20 },
    children: [
      new TextRun({
        text: 'عرض سعر',
        bold: true,
        size: 26,
        color: '433C71',
      }),
      new TextRun({
        text: ` — ${formatProposalDetailedTitle(clientInfo)}`,
        bold: true,
        size: 20,
        color: '1A1A1A',
      }),
    ],
  });

  // --- 3. PROJECT & CLIENT INFO TABLE (أولًا: بيانات العرض والمشروع) ---
  const infoRow3 = (
    l1: string,
    v1: string,
    l2: string,
    v2: string,
    l3: string,
    v3: string
  ) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 13, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              children: [new TextRun({ text: l1, bold: true, size: 15, color: '433C71' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              children: [new TextRun({ text: v1 || '-', bold: true, size: 15, color: '1A1A1A' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 13, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              children: [new TextRun({ text: l2, bold: true, size: 15, color: '433C71' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              children: [new TextRun({ text: v2 || '-', bold: true, size: 15, color: '1A1A1A' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 14, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              children: [new TextRun({ text: l3, bold: true, size: 15, color: '433C71' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              children: [new TextRun({ text: v3 || '-', bold: true, size: 15, color: '1A1A1A' })],
            }),
          ],
        }),
      ],
    });
  };

  const projectInfoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      infoRow3(
        'رقم العرض:',
        clientInfo.proposalNumber,
        'التاريخ:',
        clientInfo.date,
        'اسم العميل:',
        clientInfo.clientName || 'العميل الكريم'
      ),
      infoRow3(
        'نوع المبنى:',
        clientInfo.buildingType || '-',
        'المدينة / الحي:',
        `${clientInfo.projectCity} - ${clientInfo.district || 'غير محدد'}`,
        'القطعة / المخطط:',
        `${clientInfo.plotNumber || '-'} / ${clientInfo.planNumber || '-'}`
      ),
      infoRow3(
        areaDetails.label,
        areaDetails.value,
        'نوع الخدمة:',
        clientInfo.serviceType,
        'صلاحية العرض:',
        `${clientInfo.validityDays || 30} يوماً`
      ),
    ],
  });

  // --- 4. PROPOSAL INTRODUCTION (ثانيًا: مقدمة العرض) ---
  const introParagraph = new Paragraph({
    alignment: AlignmentType.BOTH,
    bidirectional: true,
    spacing: { before: 40, after: 60 },
    children: [
      new TextRun({ text: 'السيد/ ', size: 16 }),
      new TextRun({ text: clientInfo.clientName || 'العميل المحترم', bold: true, size: 16, color: '433C71' }),
      new TextRun({ text: ' المحترم، بناءً على طلبكم، يسر شركة ', size: 16 }),
      new TextRun({ text: 'الرؤية المضيئة للاستشارات الهندسية ', bold: true, size: 16, color: '433C71' }),
      new TextRun({ text: 'أن تقدم لسعادتكم عرض السعر الخاص بأعمال ', size: 16 }),
      new TextRun({ text: `${clientInfo.serviceType} `, bold: true, size: 16 }),
      new TextRun({ text: 'لمشروع ', size: 16 }),
      new TextRun({ text: `${clientInfo.buildingType}`, bold: true, size: 16 }),
      new TextRun({ text: `، بمدينة ${clientInfo.projectCity}، حي ${clientInfo.district || 'الموضح أعلاه'}، قطعة رقم (${clientInfo.plotNumber || '—'}) من المخطط رقم (${clientInfo.planNumber || '—'})، ${areaDetails.introText}، وفق النطاق والشروط أدناه.`, size: 16 }),
    ],
  });

  // --- 5. SCOPE OF WORK TABLE (ثالثًا: نطاق أعمال الاستشاري المعتمد — شبكي من عمودين) ---
  const scopeGridRows: TableRow[] = [];
  for (let i = 0; i < activeScopeItems.length; i += 2) {
    const first = activeScopeItems[i];
    const second = activeScopeItems[i + 1];
    if (second) {
      scopeGridRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              shading: { fill: 'F9FAFB', type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  bidirectional: true,
                  children: [
                    new TextRun({ text: `${i + 1}. ${first.name}: `, bold: true, size: 16, color: '433C71' }),
                    new TextRun({ text: first.description, size: 15, color: '333333' }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              shading: { fill: 'F9FAFB', type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  bidirectional: true,
                  children: [
                    new TextRun({ text: `${i + 2}. ${second.name}: `, bold: true, size: 16, color: '433C71' }),
                    new TextRun({ text: second.description, size: 15, color: '333333' }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    } else {
      scopeGridRows.push(
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              shading: { fill: 'F9FAFB', type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  bidirectional: true,
                  children: [
                    new TextRun({ text: `${i + 1}. ${first.name}: `, bold: true, size: 16, color: '433C71' }),
                    new TextRun({ text: first.description, size: 15, color: '333333' }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    }
  }

  const scopeTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: scopeGridRows,
  });

  // --- 6. TERMS, TIMELINES & EXCLUSIONS (رابعًا: الشروط والالتزامات العامة والتنفيذية — عمودان جنباً إلى جنب) ---
  const createCompactBullet = (text: string, boldPrefix?: string) =>
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      spacing: { after: 25 },
      children: [
        new TextRun({ text: '• ', bold: true, color: 'E37725', size: 15 }),
        ...(boldPrefix ? [new TextRun({ text: `${boldPrefix} `, bold: true, size: 15, color: '1A1A1A' })] : []),
        new TextRun({ text, size: 15, color: '333333' }),
      ],
    });

  const executionNotice =
    clientInfo.startDateNotice && !clientInfo.startDateNotice.includes('اعتماد الفكرة المعمارية')
      ? clientInfo.startDateNotice
      : 'من سداد الدفعة واعتماد المخططات المعمارية والواجهات';

  const leftTermsChildren: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      spacing: { after: 30 },
      children: [new TextRun({ text: 'التزامات المالك والأعمال المستثناة:', bold: true, size: 16, color: '433C71' })],
    }),
    ...GENERAL_OWNER_OBLIGATIONS.slice(0, 3).map((ob) => createCompactBullet(ob)),
  ];

  if (
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
  ) {
    leftTermsChildren.push(
      createCompactBullet(
        'يؤكد هذا العرض على أن نطاق الأعمال المتفق عليه لا يشمل أعمال الإشراف الهندسي الميداني على التنفيذ.',
        'تأكيد (بدون إشراف):'
      )
    );
  }

  if (clientInfo.exclusions?.excludeGovFees) {
    leftTermsChildren.push(createCompactBullet(EXCLUSION_CLAUSES.excludeGovFees, 'مستثنى:'));
  }
  if (clientInfo.exclusions?.customExclusions?.trim()) {
    leftTermsChildren.push(createCompactBullet(clientInfo.exclusions.customExclusions.trim(), 'مستثنى:'));
  }

  const rightTermsChildren: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      spacing: { after: 30 },
      children: [new TextRun({ text: 'المدد الزمنية والتعديلات والملكية الفكرية:', bold: true, size: 16, color: '433C71' })],
    }),
    createCompactBullet(`${clientInfo.executionDurationDays || 45} يوم عمل ${executionNotice}.`, 'مدة التنفيذ:'),
    createCompactBullet(`${clientInfo.revisionCountText || 'تعديلان (2)'}، ويعتمد كل طور قبل التالي.`, 'الاعتمادات:'),
    createCompactBullet('المخرجات الهندسية تخضع لحقوق الاستخدام لموقع المشروع حصراً.', 'الملكية الفكرية:'),
  ];

  const termsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 52, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            shading: { fill: 'F9FAFB', type: ShadingType.CLEAR },
            children: leftTermsChildren,
          }),
          new TableCell({
            width: { size: 48, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            shading: { fill: 'F9FAFB', type: ShadingType.CLEAR },
            children: rightTermsChildren,
          }),
        ],
      }),
    ],
  });

  // --- 7 & 8. SIDE-BY-SIDE FINANCIAL SUMMARY + MILESTONES & BANK (خامسًا وسادسًا في صف واحد متناسق) ---
  const financialRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 68, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              children: [new TextRun({ text: `أتعاب أعمال ${clientInfo.serviceType}:`, bold: true, size: 16 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 32, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              bidirectional: true,
              children: [new TextRun({ text: formatSAR(subtotal), bold: true, size: 16, color: '1A1A1A' })],
            }),
          ],
        }),
      ],
    }),
  ];

  if (discountAmount > 0) {
    financialRows.push(
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            shading: { fill: 'FEF2F2', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                children: [
                  new TextRun({
                    text: `الخصم التجاري الممنوح (${
                      clientInfo.discountType === 'percentage' ? `${clientInfo.discountValue}%` : 'خاص'
                    }):`,
                    bold: true,
                    size: 15,
                    color: 'DC2626',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            borders: cellBorders,
            shading: { fill: 'FEF2F2', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                bidirectional: true,
                children: [
                  new TextRun({ text: `- ${formatSAR(discountAmount)}`, bold: true, size: 15, color: 'DC2626' }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  }

  if (clientInfo.includeTax) {
    financialRows.push(
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                children: [new TextRun({ text: 'ضريبة القيمة المضافة المستحقة (15%):', size: 15 })],
              }),
            ],
          }),
          new TableCell({
            borders: cellBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                bidirectional: true,
                children: [new TextRun({ text: formatSAR(taxAmount), bold: true, size: 15 })],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    financialRows.push(
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            columnSpan: 2,
            shading: { fill: 'F9FAFB', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                children: [
                  new TextRun({
                    text: '* الأسعار أعلاه غير شاملة ضريبة القيمة المضافة',
                    size: 14,
                    color: '666666',
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  }

  financialRows.push(
    new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          shading: { fill: '2D2A4A', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              children: [
                new TextRun({
                  text: `الإجمالي النهائي ${clientInfo.includeTax ? 'شامل الضريبة' : ''}:`,
                  bold: true,
                  size: 17,
                  color: 'FFFFFF',
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          borders: cellBorders,
          shading: { fill: '2D2A4A', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              bidirectional: true,
              children: [
                new TextRun({
                  text: formatSAR(grandTotal),
                  bold: true,
                  size: 18,
                  color: 'FCD34D',
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          columnSpan: 2,
          shading: { fill: 'FEF3C7', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              children: [
                new TextRun({ text: 'المبلغ كتابةً: ', bold: true, size: 15, color: '92400E' }),
                new TextRun({ text: tafqeetSAR(grandTotal), bold: true, size: 15, color: '78350F' }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  const financialTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: financialRows,
  });

  const milestoneAndBankRows: TableRow[] = [
    ...milestones.map(
      (m) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  bidirectional: true,
                  children: [new TextRun({ text: m.title, bold: true, size: 15, color: '1A1A1A' })],
                }),
                ...(m.description
                  ? [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        bidirectional: true,
                        children: [new TextRun({ text: m.description, size: 13, color: '666666' })],
                      }),
                    ]
                  : []),
              ],
            }),
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  bidirectional: true,
                  children: [new TextRun({ text: formatSAR(m.amount), bold: true, size: 15, color: '433C71' })],
                }),
              ],
            }),
          ],
        })
    ),
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          borders: cellBorders,
          shading: { fill: 'F9FAFB', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              children: [
                new TextRun({ text: 'البنك: ', bold: true, size: 14 }),
                new TextRun({
                  text: `${clientInfo.bankDetails?.bankName || 'البنك السعودي للاستثمار'} (${
                    clientInfo.bankDetails?.accountName || 'شركة مجموعة الرؤية المضيئة للاستشارات الهندسية'
                  })`,
                  size: 14,
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              children: [
                new TextRun({ text: 'IBAN: ', bold: true, size: 15, color: 'E37725' }),
                new TextRun({ text: clientInfo.bankDetails?.iban || '-', bold: true, size: 15, color: '1A1A1A' }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  const milestonesAndBankTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: milestoneAndBankRows,
  });

  const combinedFinancialAndMilestonesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellNoBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 56, type: WidthType.PERCENTAGE },
            borders: cellNoBorders,
            children: [
              createSectionHeader('خامسًا: الأسعار والبيان المالي'),
              financialTable,
            ],
          }),
          new TableCell({
            width: { size: 2, type: WidthType.PERCENTAGE },
            borders: cellNoBorders,
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: 42, type: WidthType.PERCENTAGE },
            borders: cellNoBorders,
            children: [
              createSectionHeader('سادسًا: جدول الدفعات والبنك'),
              milestonesAndBankTable,
            ],
          }),
        ],
      }),
    ],
  });

  // --- 9. SIGNATURES & OFFICIAL SEAL (سابعًا: الاعتمادات والتوقيعات والختم المعتمد) ---
  const signaturesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellNoBorders,
    rows: [
      new TableRow({
        children: [
          // Client signature block (Right)
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: cellNoBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                children: [
                  new TextRun({ text: 'اعتماد وقبول العميل:', bold: true, size: 17, color: '1A1A1A' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                spacing: { before: 30 },
                children: [
                  new TextRun({ text: 'الاسم: ....................................................', size: 15 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                spacing: { before: 30 },
                children: [
                  new TextRun({ text: 'التوقيع: ..................................................', size: 15 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                spacing: { before: 30 },
                children: [
                  new TextRun({ text: 'التاريخ: ..... / ..... / 2026 م', size: 15 }),
                ],
              }),
            ],
          }),

          // Engineering office approval & seal (Left)
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: cellNoBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                bidirectional: true,
                children: [
                  new TextRun({ text: 'اعتماد شركة الرؤية المضيئة للاستشارات الهندسية:', bold: true, size: 17, color: '433C71' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                bidirectional: true,
                spacing: { before: 30 },
                children: [
                  new TextRun({ text: 'إعداد المهندس: ', bold: true, size: 15 }),
                  new TextRun({ text: cleanEngineerName(clientInfo.preparedBy), bold: true, size: 16, color: '1A1A1A' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                bidirectional: true,
                spacing: { before: 20 },
                children: [
                  sealBuffer
                    ? new ImageRun({
                        data: sealBuffer,
                        transformation: { width: 105, height: 55 },
                        type: 'png',
                      })
                    : new TextRun({
                        text: '[الختم المعتمد لشركة الرؤية المضيئة]',
                        bold: true,
                        size: 15,
                        color: '433C71',
                      }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // --- 10. DOCUMENT FOOTER (تذييل الوثيقة الرسمية) ---
  const docFooterParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    bidirectional: true,
    spacing: { before: 60 },
    children: [
      new TextRun({
        text: `مجموعة شركات الرؤية المضيئة للاستشارات الهندسية والتصميم • عرض سعر رقم ${clientInfo.proposalNumber} • س.ت: 1010788646 • وثيقة عرض سعر معتمدة رسمياً`,
        size: 13,
        color: '888888',
      }),
    ],
  });

  // --- BUILD SMART CONTRACT SECTION CHILDREN IF REQUESTED ---
  const buildContractWordChildren = (contract: ContractData): (Paragraph | Table)[] => {
    const ordinals = ['أولاً', 'ثانياً', 'ثالثاً', 'رابعاً', 'خامساً', 'سادساً', 'سابعاً', 'ثامناً'];
    let ordIdx = 0;
    const nextOrd = () => ordinals[ordIdx++] || `${ordIdx}`;

    const contractBorder = { style: BorderStyle.SINGLE, size: 1, color: 'D6D3CB' };
    const cBorders = { top: contractBorder, bottom: contractBorder, left: contractBorder, right: contractBorder };

    const makeArticleBar = (ord: string, title: string) =>
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: cellNoBorders,
                shading: { fill: 'E5E3DC', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    bidirectional: true,
                    spacing: { before: 40, after: 40 },
                    children: [
                      new TextRun({ text: `${ord} :  ${title}`, bold: true, size: 20, color: '26282A' }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });

    const firstPartyName = contract.firstPartyName?.trim() || clientInfo.clientName?.trim() || '........................';
    const firstPartyId = contract.firstPartyId?.trim() || clientInfo.nationalId?.trim() || '........................';
    const firstPartyAddress = contract.firstPartyAddress?.trim() || `مدينة ${clientInfo.projectCity || 'الرياض'}`;
    const firstPartyPhone = contract.firstPartyPhone?.trim() || clientInfo.phone?.trim() || '........................';
    const firstPartyEmail = contract.firstPartyEmail?.trim() || clientInfo.email?.trim() || '—';
    const deedNo = contract.propertyRealEstateNumber?.trim() || clientInfo.deedNumber?.trim() || '—';
    const numericArea = areaDetails.numericArea || clientInfo.landArea || 0;

    const children: (Paragraph | Table)[] = [];

    // Contract Letterhead
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: cellNoBorders,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 65, type: WidthType.PERCENTAGE },
                borders: cellNoBorders,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    bidirectional: true,
                    children: [
                      new TextRun({
                        text: 'شركة الرؤية المضيئة للاستشارات الهندسية',
                        bold: true,
                        size: 20,
                        color: '2C2E30',
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    bidirectional: true,
                    children: [
                      new TextRun({
                        text: 'LUMINOUS VISION ENGINEERING CONSULTANCY',
                        bold: true,
                        size: 14,
                        color: 'A6926B',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 35, type: WidthType.PERCENTAGE },
                borders: cellNoBorders,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    bidirectional: true,
                    children: [
                      new TextRun({ text: `رقم العقد: ${contract.contractNumber}`, bold: true, size: 15, color: '2C2E30' }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    bidirectional: true,
                    children: [
                      new TextRun({
                        text: `التاريخ: ${formatContractDisplayDate(contract.signingDate)} م`,
                        size: 14,
                        color: '5E5C57',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    // Title Banner
    children.push(
      new Paragraph({ spacing: { before: 80, after: 40 }, children: [] }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: {
                  top: noBorder,
                  bottom: noBorder,
                  right: noBorder,
                  left: { style: BorderStyle.SINGLE, size: 24, color: 'A6926B' },
                },
                shading: { fill: 'ECEBE7', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    bidirectional: true,
                    spacing: { before: 80, after: contract.contractSubtitle ? 20 : 80 },
                    children: [
                      new TextRun({ text: contract.contractTitle, bold: true, size: 30, color: '26282A' }),
                    ],
                  }),
                  ...(contract.contractSubtitle?.trim()
                    ? [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          bidirectional: true,
                          spacing: { after: 80 },
                          children: [
                            new TextRun({ text: contract.contractSubtitle, bold: true, size: 26, color: '3A3C3E' }),
                          ],
                        }),
                      ]
                    : []),
                ],
              }),
            ],
          }),
        ],
      })
    );

    // Basmalah & signing declaration
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        bidirectional: true,
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({
            text: 'الحمد لله رب العالمين والصلاة والسلام على نبينا محمد وعلى آله وصحبه أجمعين أما بعد،',
            bold: true,
            size: 18,
            color: '2C2E30',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        bidirectional: true,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: `بعون من الله وتوفيقه تم إبرام العقد رقم (${contract.contractNumber}) والتوقيع عليه بمدينة ${contract.signingCity || 'الرياض'} يوم ${contract.signingDayName} الموافق ${formatContractDisplayDate(contract.signingDate)} م`,
            size: 17,
            color: '3A3C3E',
          }),
        ],
      })
    );

    // Parties & Preamble boxes
    const partyBox = (label: string, body: string, fill: string) =>
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: cellNoBorders,
                shading: { fill, type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.BOTH,
                    bidirectional: true,
                    spacing: { before: 50, after: 50 },
                    children: [
                      new TextRun({ text: `${label}: `, bold: true, size: 17, color: '1F2022' }),
                      new TextRun({ text: body, size: 17, color: '2C2E30' }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });

    children.push(
      partyBox(
        'الطرف الأول',
        `${firstPartyName} – هوية رقم: (${firstPartyId})، عنوان: ${firstPartyAddress}، جوال: ${firstPartyPhone}، بريد إلكتروني: (${firstPartyEmail})، مالك قطعة الأرض برقم (${clientInfo.plotNumber || '—'})، من المخطط رقم (${clientInfo.planNumber || '—'})، برقم الصك/العقار (${deedNo})، الواقعة في حي ${clientInfo.district || 'الموضح أعلاه'}، بمدينة ${clientInfo.projectCity || 'الرياض'}، بمساحة إجمالية وقدرها (${formatNumber(numericArea)} م²)، ويشار إليه فيما بعد بالطرف الأول أو المالك.`,
        'F3F0E8'
      ),
      new Paragraph({ spacing: { after: 40 }, children: [] }),
      partyBox('الطرف الثاني', contract.secondPartyText, 'ECEBE7'),
      new Paragraph({ spacing: { after: 40 }, children: [] }),
      partyBox('المقدمة', contract.preambleText, 'F3F0E8'),
      new Paragraph({ spacing: { after: 80 }, children: [] })
    );

    // Optional Project Overview
    if (contract.showProjectOverview && contract.projectOverviewText.trim()) {
      children.push(
        makeArticleBar(nextOrd(), 'الوصف العام للمشروع :'),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { before: 50, after: 80 },
          children: [new TextRun({ text: contract.projectOverviewText, bold: true, size: 17, color: '2C2E30' })],
        })
      );
    }

    // Consultant Scope
    children.push(makeArticleBar(nextOrd(), contract.consultantScopeTitle || 'التزامات الاستشاري :'));
    contract.scopeGroups.forEach((group) => {
      if (group.title?.trim()) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { before: 70, after: 25 },
            children: [new TextRun({ text: group.title, bold: true, size: 18, color: '26282A' })],
          })
        );
      }
      if (group.subtitle?.trim()) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { before: 30, after: 20 },
            children: [new TextRun({ text: group.subtitle, bold: true, size: 16, color: '5E5C57' })],
          })
        );
      }
      group.items.forEach((line) => {
        children.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { after: 25 },
            children: [
              new TextRun({ text: '• ', bold: true, size: 16, color: 'A6926B' }),
              new TextRun({ text: line, size: 16, color: '2C2E30' }),
            ],
          })
        );
      });
    });

    // Supervision Inspection Stages
    if (contract.showSupervisionStages && contract.supervisionStages.length > 0) {
      children.push(
        new Paragraph({ spacing: { before: 80 }, children: [] }),
        makeArticleBar(nextOrd(), contract.supervisionStagesTitle || 'مراحل استلامات الأعمال :'),
        ...(contract.supervisionMaxVisitsText
          ? [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                spacing: { before: 50, after: 25 },
                children: [new TextRun({ text: contract.supervisionMaxVisitsText, bold: true, size: 16 })],
              }),
            ]
          : []),
        ...(contract.supervisionExtraVisitFeeText
          ? [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                spacing: { after: 60 },
                children: [new TextRun({ text: contract.supervisionExtraVisitFeeText, bold: true, size: 16, color: '7C6840' })],
              }),
            ]
          : []),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 12, type: WidthType.PERCENTAGE },
                  borders: cBorders,
                  shading: { fill: 'ECEBE7', type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      bidirectional: true,
                      children: [new TextRun({ text: 'م', bold: true, size: 16 })],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 88, type: WidthType.PERCENTAGE },
                  borders: cBorders,
                  shading: { fill: 'ECEBE7', type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      bidirectional: true,
                      children: [new TextRun({ text: 'البيان (المرحلة الإنشائية)', bold: true, size: 16 })],
                    }),
                  ],
                }),
              ],
            }),
            ...contract.supervisionStages.map(
              (stg, idx) =>
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cBorders,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          bidirectional: true,
                          children: [new TextRun({ text: `${idx + 1}`, bold: true, size: 15 })],
                        }),
                      ],
                    }),
                    new TableCell({
                      borders: cBorders,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          bidirectional: true,
                          children: [new TextRun({ text: stg, bold: true, size: 16 })],
                        }),
                      ],
                    }),
                  ],
                })
            ),
          ],
        })
      );
    }

    // Owner Obligations
    if (contract.ownerObligations.length > 0) {
      children.push(
        new Paragraph({ spacing: { before: 80 }, children: [] }),
        makeArticleBar(nextOrd(), 'التزامات المالك :'),
        ...contract.ownerObligations.map(
          (ob) =>
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              spacing: { before: 30, after: 25 },
              children: [
                new TextRun({ text: '• ', bold: true, size: 16, color: 'A6926B' }),
                new TextRun({ text: ob, size: 16, color: '2C2E30' }),
              ],
            })
        )
      );
    }

    // Timeline Table
    if (contract.showTimelineTable && contract.timelineRows.length > 0) {
      children.push(
        new Paragraph({ spacing: { before: 80 }, children: [] }),
        makeArticleBar(nextOrd(), 'المدة الزمنية لإنهاء مراحل المشروع :'),
        ...contract.timelineNotes.map(
          (note) =>
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              spacing: { before: 25, after: 25 },
              children: [new TextRun({ text: note, size: 16, color: '3A3C3E' })],
            })
        ),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: ['المرحلة', 'وصف العمل', 'تفاصيل الأعمال', 'الفترة الزمنية'].map(
                (head) =>
                  new TableCell({
                    borders: cBorders,
                    shading: { fill: '3A3C3E', type: ShadingType.CLEAR },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        bidirectional: true,
                        children: [new TextRun({ text: head, bold: true, size: 16, color: 'FFFFFF' })],
                      }),
                    ],
                  })
              ),
            }),
            ...contract.timelineRows.map(
              (row) =>
                new TableRow({
                  children: [row.stage, row.workTitle, row.details, row.duration].map(
                    (val) =>
                      new TableCell({
                        borders: cBorders,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            bidirectional: true,
                            children: [new TextRun({ text: val, size: 15, color: '2C2E30' })],
                          }),
                        ],
                      })
                  ),
                })
            ),
            new TableRow({
              children: [
                new TableCell({
                  columnSpan: 3,
                  borders: cBorders,
                  shading: { fill: 'ECEBE7', type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      bidirectional: true,
                      children: [new TextRun({ text: contract.timelineTotalLabel, bold: true, size: 16 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cBorders,
                  shading: { fill: 'ECEBE7', type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      bidirectional: true,
                      children: [new TextRun({ text: contract.timelineTotalDuration, bold: true, size: 16 })],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    }

    // General Terms
    if (contract.generalTerms.length > 0) {
      children.push(
        new Paragraph({ spacing: { before: 80 }, children: [] }),
        makeArticleBar(nextOrd(), 'شروط عامة :'),
        ...contract.generalTerms.map(
          (term) =>
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              spacing: { before: 30, after: 25 },
              children: [
                new TextRun({ text: '• ', bold: true, size: 16, color: 'A6926B' }),
                new TextRun({ text: term, size: 16, color: '2C2E30' }),
              ],
            })
        )
      );
    }

    // IP Rights
    if (contract.showIpRights && contract.ipRights.length > 0) {
      children.push(
        new Paragraph({ spacing: { before: 80 }, children: [] }),
        makeArticleBar(nextOrd(), 'حقوق الملكية الفكرية والفنية :'),
        ...contract.ipRights.map(
          (ip) =>
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              spacing: { before: 30, after: 25 },
              children: [
                new TextRun({ text: '• ', bold: true, size: 16, color: 'A6926B' }),
                new TextRun({ text: ip, size: 16, color: '2C2E30' }),
              ],
            })
        )
      );
    }

    // Pricing, Payment Schedule & Bank Details
    children.push(
      new Paragraph({ spacing: { before: 80 }, children: [] }),
      makeArticleBar(nextOrd(), 'الأسعار وطريقة الدفع :'),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { before: 50, after: 50 },
        children: [new TextRun({ text: contract.pricingIntroText, size: 16, color: '2C2E30' })],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: ['م', 'البيان', 'المبلغ الإجمالي (ر.س)'].map(
              (h) =>
                new TableCell({
                  borders: cBorders,
                  shading: { fill: '3A3C3E', type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      bidirectional: true,
                      children: [new TextRun({ text: h, bold: true, size: 16, color: 'FFFFFF' })],
                    }),
                  ],
                })
            ),
          }),
          ...items.map(
            (it, idx) =>
              new TableRow({
                children: [
                  new TableCell({
                    borders: cBorders,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        bidirectional: true,
                        children: [new TextRun({ text: `${idx + 1}`, size: 15 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    borders: cBorders,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        bidirectional: true,
                        children: [new TextRun({ text: it.title, bold: true, size: 16 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    borders: cBorders,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        bidirectional: true,
                        children: [new TextRun({ text: formatSAR(it.totalPrice), bold: true, size: 16 })],
                      }),
                    ],
                  }),
                ],
              })
          ),
          ...(discountAmount > 0
            ? [
                new TableRow({
                  children: [
                    new TableCell({ borders: cBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '—', size: 15 })] })] }),
                    new TableCell({
                      borders: cBorders,
                      shading: { fill: 'F3F0E8', type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          bidirectional: true,
                          children: [
                            new TextRun({
                              text: `خصم تجاري ${clientInfo.discountType === 'percentage' ? `بنسبة ${clientInfo.discountValue}%` : 'خاص'}`,
                              bold: true,
                              size: 16,
                              color: '7C6840',
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      borders: cBorders,
                      shading: { fill: 'F3F0E8', type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          bidirectional: true,
                          children: [new TextRun({ text: `- ${formatSAR(discountAmount)}`, bold: true, size: 16, color: '7C6840' })],
                        }),
                      ],
                    }),
                  ],
                }),
              ]
            : []),
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 2,
                borders: cBorders,
                shading: { fill: '3A3C3E', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    bidirectional: true,
                    children: [new TextRun({ text: 'إجمالي قيمة العقد بدون الضريبة', bold: true, size: 16, color: 'FFFFFF' })],
                  }),
                ],
              }),
              new TableCell({
                borders: cBorders,
                shading: { fill: '3A3C3E', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    bidirectional: true,
                    children: [new TextRun({ text: formatSAR(amountAfterDiscount), bold: true, size: 16, color: 'FFFFFF' })],
                  }),
                ],
              }),
            ],
          }),
          ...(clientInfo.includeTax
            ? [
                new TableRow({
                  children: [
                    new TableCell({
                      columnSpan: 2,
                      borders: cBorders,
                      shading: { fill: '4B4D50', type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          bidirectional: true,
                          children: [new TextRun({ text: 'إجمالي قيمة الضريبة (15%)', bold: true, size: 16, color: 'FFFFFF' })],
                        }),
                      ],
                    }),
                    new TableCell({
                      borders: cBorders,
                      shading: { fill: '4B4D50', type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          bidirectional: true,
                          children: [new TextRun({ text: formatSAR(taxAmount), bold: true, size: 16, color: 'FFFFFF' })],
                        }),
                      ],
                    }),
                  ],
                }),
              ]
            : []),
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 2,
                borders: cBorders,
                shading: { fill: '2A2C2E', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    bidirectional: true,
                    children: [
                      new TextRun({
                        text: clientInfo.includeTax ? 'إجمالي قيمة العقد شامل الضريبة' : 'إجمالي قيمة العقد',
                        bold: true,
                        size: 17,
                        color: 'FFFFFF',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: cBorders,
                shading: { fill: '2A2C2E', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    bidirectional: true,
                    children: [new TextRun({ text: formatSAR(grandTotal), bold: true, size: 17, color: 'F3DFB8' })],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 3,
                borders: cBorders,
                shading: { fill: '3A3C3E', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    bidirectional: true,
                    children: [new TextRun({ text: tafqeetSAR(grandTotal), bold: true, size: 16, color: 'F3DFB8' })],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { before: 80, after: 40 },
        children: [new TextRun({ text: contract.paymentMethodNote, bold: true, size: 16, color: '2C2E30' })],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: ['م', 'الدفعة', 'البيان', 'النسبة', 'المبلغ'].map(
              (h) =>
                new TableCell({
                  borders: cBorders,
                  shading: { fill: '3A3C3E', type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      bidirectional: true,
                      children: [new TextRun({ text: h, bold: true, size: 15, color: 'FFFFFF' })],
                    }),
                  ],
                })
            ),
          }),
          ...milestones.map(
            (m, idx) =>
              new TableRow({
                children: [`${idx + 1}`, m.title, m.description, `${m.percentage}%`, formatSAR(m.amount)].map(
                  (val) =>
                    new TableCell({
                      borders: cBorders,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          bidirectional: true,
                          children: [new TextRun({ text: val, size: 15 })],
                        }),
                      ],
                    })
                ),
              })
          ),
        ],
      }),
      new Paragraph({ spacing: { before: 60 }, children: [] }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          ['البنك', clientInfo.bankDetails?.bankName || 'البنك السعودي للاستثمار'],
          ['اسم الحساب', clientInfo.bankDetails?.accountName || 'شركة الرؤية المضيئة للاستشارات الهندسية'],
          ...(clientInfo.bankDetails?.accountNumber
            ? [['رقم الحساب', clientInfo.bankDetails.accountNumber]]
            : []),
          ['الآيبان (IBAN)', clientInfo.bankDetails?.iban || 'SA83 6500 0000 1383 4937 6001'],
        ].map(
          ([k, v]) =>
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 28, type: WidthType.PERCENTAGE },
                  borders: cBorders,
                  shading: { fill: 'F6F5F1', type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      bidirectional: true,
                      children: [new TextRun({ text: k, bold: true, size: 15, color: '5E5C57' })],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 72, type: WidthType.PERCENTAGE },
                  borders: cBorders,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      bidirectional: true,
                      children: [new TextRun({ text: v, bold: true, size: 15, color: '26282A' })],
                    }),
                  ],
                }),
              ],
            })
        ),
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        bidirectional: true,
        spacing: { before: 100, after: 60 },
        children: [new TextRun({ text: contract.closingText || 'هذا والله ولي التوفيق،', bold: true, size: 18 })],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: ['الطرف الأول (المالك)', 'الطرف الثاني (الاستشاري)'].map(
              (h) =>
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: cBorders,
                  shading: { fill: '3A3C3E', type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      bidirectional: true,
                      children: [new TextRun({ text: h, bold: true, size: 17, color: 'FFFFFF' })],
                    }),
                  ],
                })
            ),
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: cBorders,
                shading: { fill: 'F3F0E8', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    bidirectional: true,
                    spacing: { before: 60, after: 40 },
                    children: [new TextRun({ text: firstPartyName, bold: true, size: 17 })],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    bidirectional: true,
                    children: [new TextRun({ text: 'التوقيع: ........................................', size: 15 })],
                  }),
                ],
              }),
              new TableCell({
                borders: cBorders,
                shading: { fill: 'F3F0E8', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    bidirectional: true,
                    spacing: { before: 60, after: 20 },
                    children: [new TextRun({ text: 'شركة الرؤية المضيئة للاستشارات الهندسية', bold: true, size: 17 })],
                  }),
                  ...(contract.showCompanySeal && sealBuffer
                    ? [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new ImageRun({
                              data: sealBuffer,
                              transformation: { width: 95, height: 50 },
                              type: 'png',
                            }),
                          ],
                        }),
                      ]
                    : [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          bidirectional: true,
                          children: [new TextRun({ text: 'التوقيع والختم: ................................', size: 15 })],
                        }),
                      ]),
                ],
              }),
            ],
          }),
        ],
      })
    );

    return children;
  };

  // Assemble Word sections according to bundleMode
  const quotationChildren = [
    headerTable,
    proposalTitleParagraph,

    createSectionHeader('أولًا: بيانات العرض والمشروع'),
    projectInfoTable,

    createSectionHeader('ثانيًا: مقدمة العرض'),
    introParagraph,

    createSectionHeader('ثالثًا: نطاق أعمال الاستشاري المعتمد', `${activeScopeItems.length} وحدات هندسية مشمولة`),
    scopeTable,

    createSectionHeader('رابعًا: الشروط والالتزامات العامة والتنفيذية'),
    termsTable,

    combinedFinancialAndMilestonesTable,

    createSectionHeader('سابعًا: الاعتمادات والتوقيعات والختم المعتمد'),
    signaturesTable,
    docFooterParagraph,
  ];

  const sections: any[] = [];

  if (effectiveBundle === 'quote_only' || effectiveBundle === 'quote_and_contract') {
    sections.push({
      properties: {
        page: {
          margin: {
            top: 420, // ~7.4mm margin for single-page A4 fit
            bottom: 420,
            left: 480,
            right: 480,
          },
        },
      },
      children: quotationChildren,
    });
  }

  if (effectiveBundle === 'quote_and_contract' || effectiveBundle === 'contract_only') {
    const resolvedContract = resolveActiveContractData(clientInfo, items);
    sections.push({
      properties: {
        page: {
          margin: {
            top: 680,
            bottom: 680,
            left: 720,
            right: 720,
          },
        },
      },
      children: buildContractWordChildren(resolvedContract),
    });
  }

  const doc = new Document({ sections });

  return await Packer.toBlob(doc);
}

export function downloadWordDocument(
  clientInfo: ClientInfo,
  items: QuotationItem[],
  bundleMode?: DocumentOutputBundle
) {
  const effectiveBundle: DocumentOutputBundle =
    bundleMode || (clientInfo.contractData?.enabled ? 'quote_and_contract' : 'quote_only');

  generateWordDocumentBlob(clientInfo, items, effectiveBundle).then((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileNo = generatePdfFileName(clientInfo);
    const suffix =
      effectiveBundle === 'contract_only'
        ? `_عقد`
        : effectiveBundle === 'quote_and_contract'
        ? `_عرض_وعقد`
        : '';
    a.download = `${fileNo}${suffix}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
