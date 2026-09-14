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
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/admin/blog"
        className="text-sm text-slate-500 hover:underline dark:text-slate-400"
      >
        ← Artículos
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Nuevo artículo
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Nacerá como borrador. Podrás añadirle portada y publicarlo después.
      </p>

      <div className="mt-8">
        <PostForm accion={crearPostAction} textoBoton="Crear borrador" />
      </div>
    </main>
  );
}
