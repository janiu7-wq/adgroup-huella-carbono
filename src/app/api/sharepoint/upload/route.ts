import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/sharepoint/upload
 * Recibe: FormData con 'file', 'empresaId', 'periodo'
 * Sube a SharePoint via Microsoft Graph API o activa modo simulado si faltan credenciales.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const empresaId = (formData.get('empresaId') as string) || 'general';
    const periodo = (formData.get('periodo') as string) || new Date().toISOString().slice(0, 7);

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const siteId = process.env.SHAREPOINT_SITE_ID;

    // Modo Simulación Segura: si las credenciales de Azure no están en el entorno
    if (!tenantId || !clientId || !clientSecret || !siteId) {
      console.info('[SharePoint API] Credenciales no configuradas. Operando en modo demostración.');
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const simulatedUrl = `https://sharepoint.com/sites/adgroup/evidencias/${empresaId}/${periodo}/${cleanFileName}`;
      return NextResponse.json({
        success: true,
        simulated: true,
        name: file.name,
        url: simulatedUrl,
        path: `SharePoint/${empresaId}/${periodo}/${cleanFileName}`,
        message: 'Modo simulado activo. Para conectar tu SharePoint real, agrega las variables AZURE_* en Vercel.'
      });
    }

    // 1. Obtener Token de acceso de Microsoft Identity Platform (OAuth2 client credentials)
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    });

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[SharePoint Auth Error]', errText);
      return NextResponse.json({ error: 'Error autenticando con Microsoft Entra ID', details: errText }, { status: 502 });
    }

    const { access_token } = await tokenRes.json();

    // 2. Subir archivo a la biblioteca de documentos de SharePoint
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const folderPath = `Evidencias_Huella_Carbono/${empresaId}/${periodo}`;
    const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/${folderPath}/${cleanFileName}:/content`;

    const fileBuffer = await file.arrayBuffer();

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: fileBuffer
    });

    if (!uploadRes.ok) {
      const uploadErr = await uploadRes.text();
      console.error('[SharePoint Upload Error]', uploadErr);
      return NextResponse.json({ error: 'Error al subir archivo a SharePoint', details: uploadErr }, { status: 502 });
    }

    const uploadData = await uploadRes.json();

    return NextResponse.json({
      success: true,
      simulated: false,
      name: file.name,
      url: uploadData.webUrl || uploadData['@microsoft.graph.downloadUrl'],
      id: uploadData.id,
      path: `${folderPath}/${cleanFileName}`
    });

  } catch (error: any) {
    console.error('[SharePoint API Internal Error]', error);
    return NextResponse.json({ error: 'Error interno en el servidor', message: error?.message }, { status: 500 });
  }
}
