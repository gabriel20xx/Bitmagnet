import type { FileType } from '@/lib/graphql/generated'

// Generic file-tree builder shared by the outer torrent-file list and (nested, lazily
// fetched) archive-entry listings. `TMeta` carries whatever addressing info a leaf's
// caller needs to resolve its content later - a top-level torrent file index for the
// outer tree, or a (fileIndex, entryIndex) pair for an entry inside an archive - without
// this module needing to know the difference.

export interface TreeLeafInput<TMeta> {
  path: string
  size: number
  fileType: FileType | null
  meta: TMeta
}

export interface TreeFileNode<TMeta> {
  kind: 'file'
  name: string
  path: string
  size: number
  fileType: FileType | null
  meta: TMeta
}

export interface TreeFolderNode<TMeta> {
  kind: 'folder'
  name: string
  path: string
  size: number
  fileCount: number
  children: TreeNode<TMeta>[]
}

export type TreeNode<TMeta> = TreeFileNode<TMeta> | TreeFolderNode<TMeta>

export function buildTree<TMeta>(files: readonly TreeLeafInput<TMeta>[]): TreeFolderNode<TMeta> {
  const root: TreeFolderNode<TMeta> = { kind: 'folder', name: '', path: '', size: 0, fileCount: 0, children: [] }
  const folders = new Map<string, TreeFolderNode<TMeta>>([['', root]])

  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean)
    const fileName = parts.pop() ?? file.path
    let parentPath = ''
    let parent = root
    for (const part of parts) {
      const currentPath = parentPath ? `${parentPath}/${part}` : part
      let folder = folders.get(currentPath)
      if (!folder) {
        folder = { kind: 'folder', name: part, path: currentPath, size: 0, fileCount: 0, children: [] }
        folders.set(currentPath, folder)
        parent.children.push(folder)
      }
      parent = folder
      parentPath = currentPath
    }
    parent.children.push({
      kind: 'file',
      name: fileName,
      path: file.path,
      size: file.size,
      fileType: file.fileType,
      meta: file.meta,
    })
  }

  const aggregate = (folder: TreeFolderNode<TMeta>): void => {
    let size = 0
    let fileCount = 0
    for (const child of folder.children) {
      if (child.kind === 'file') {
        size += child.size
        fileCount += 1
      } else {
        aggregate(child)
        size += child.size
        fileCount += child.fileCount
      }
    }
    folder.size = size
    folder.fileCount = fileCount
    folder.children.sort((a, b) => (a.kind !== b.kind ? (a.kind === 'folder' ? -1 : 1) : a.name.localeCompare(b.name)))
  }
  aggregate(root)

  return root
}

// All folders are collapsed by default.
// `toggled` records paths that have been explicitly expanded, so no reset is needed on data reload.
export function isNodeExpanded(path: string, toggled: Set<string>): boolean {
  return toggled.has(path)
}

export interface VisibleRow<TMeta> {
  node: TreeNode<TMeta>
  depth: number
}

// Flattens the currently-expanded tree into the ordered row list the UI actually renders, so
// pagination can apply once per torrent instead of separately within every expanded folder.
export function flattenVisibleRows<TMeta>(
  children: TreeNode<TMeta>[],
  depth: number,
  toggled: Set<string>,
): VisibleRow<TMeta>[] {
  const rows: VisibleRow<TMeta>[] = []
  for (const child of children) {
    rows.push({ node: child, depth })
    if (child.kind === 'folder' && isNodeExpanded(child.path, toggled)) {
      rows.push(...flattenVisibleRows(child.children, depth + 1, toggled))
    }
  }
  return rows
}
