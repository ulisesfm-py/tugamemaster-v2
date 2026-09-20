import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PostForm } from '@/components/post-form';
import { auth } from '@/lib/auth';
import { crearPostAction } from '@/modules/blog/actions';

export const metadata: Metadata = { title: 'Nuevo artículo · Admin' };

export default async function NuevoPostPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/admin/blog" className="text-muted-foreground text-sm hover:underline">
        ← Artículos
      </Link>

      <h1 className="font-heading text-foreground mt-4 text-3xl font-extrabold">
        Nuevo artículo
      </h1>
      <p className="text-muted-foreground mt-2">
        Nace como borrador. Podrás añadirle portada y publicarlo después.
      </p>

      <div className="mt-8">
        <PostForm accion={crearPostAction} textoBoton="Crear borrador" />
      </div>
    </main>
  );
}
