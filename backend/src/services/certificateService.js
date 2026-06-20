import admin from 'firebase-admin';

const buildCertificatePdfBuffer = async ({
  certificateNumber,
  donorName,
  bloodGroup,
  issuedAt,
  campName,
  organizerName,
  units
}) => {
  const { default: PDFDocument } = await import('pdfkit');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.rect(30, 30, 535, 782).lineWidth(2).stroke('#dc2626');
    doc.fontSize(26).fillColor('#991b1b').text('LifeLedger Donation Certificate', { align: 'center' });
    doc.moveDown(0.5).fontSize(12).fillColor('#475569').text('Issued for voluntary blood donation service', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(18).fillColor('#0f172a').text(donorName || 'Community Member', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(12).fillColor('#334155').text(
      `Blood Group: ${bloodGroup || 'N/A'}\nDonation Date: ${new Date(issuedAt).toLocaleDateString()}\nCamp: ${campName}\nOrganizer: ${organizerName}\nUnits: ${units}`,
      { align: 'center' }
    );
    doc.moveDown(2);
    doc.fontSize(14).fillColor('#0f172a').text(
      'This certificate acknowledges the donor contribution to the LifeLedger blood support network.',
      { align: 'center' }
    );
    doc.moveDown(3);
    doc.fontSize(11).fillColor('#475569').text(`Certificate ID: ${certificateNumber}`, { align: 'center' });
    doc.end();
  });
};

export const generateDonationCertificateFile = async ({
  certificateNumber,
  donorUid,
  donorName,
  bloodGroup,
  issuedAt,
  campId,
  campName,
  organizerName,
  units
}) => {
  const pdfBuffer = await buildCertificatePdfBuffer({
    certificateNumber,
    donorName,
    bloodGroup,
    issuedAt,
    campName,
    organizerName,
    units
  });

  const bucket = admin.storage().bucket();
  const year = new Date(issuedAt).getFullYear();
  const storagePath = `certificates/${year}/${campId}/${certificateNumber}.pdf`;
  const file = bucket.file(storagePath);

  await file.save(pdfBuffer, {
    resumable: false,
    metadata: {
      contentType: 'application/pdf',
      metadata: {
        donorUid,
        certificateNumber
      }
    }
  });

  let publicUrl = null;
  try {
    const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: '2099-12-31' });
    publicUrl = signedUrl;
  } catch {
    publicUrl = null;
  }

  return { storagePath, publicUrl, contentType: 'application/pdf' };
};
