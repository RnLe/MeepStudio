import { NextResponse } from "next/server";
import * as svc from "@meepstudio/services";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(await svc.fetchProjects());
}

export async function POST(request: Request) {
  const body = await request.json();
  const project = await svc.createProject(body);
  return NextResponse.json(project, { status: 201 });
}

// PUT
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;          // <- await the Promise
  const project = await request.json();

  const updated = await svc.updateProject({ documentId, project });
  return NextResponse.json(updated);
}

// DELETE
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;          // <- await the Promise
  await svc.deleteProject(documentId);

  // 204 No Content
  return NextResponse.json(null, { status: 204 });
}