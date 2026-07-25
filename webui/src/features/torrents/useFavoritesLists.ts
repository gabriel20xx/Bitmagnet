import { useQuery, useMutation } from '@apollo/client/react'
import {
  FavoritesListsDocument,
  CreateFavoritesListDocument,
  RenameFavoritesListDocument,
  DeleteFavoritesListDocument,
  type FavoritesListFragment,
} from '@/lib/graphql/generated'
import { addError } from '@/lib/toast/store'

export function useFavoritesLists() {
  const { data, loading, error, refetch } = useQuery(FavoritesListsDocument, { fetchPolicy: 'cache-and-network' })
  const [createMutation, { loading: creating }] = useMutation(CreateFavoritesListDocument)
  const [renameMutation, { loading: renaming }] = useMutation(RenameFavoritesListDocument)
  const [deleteMutation, { loading: deleting }] = useMutation(DeleteFavoritesListDocument)

  const create = (name: string): Promise<FavoritesListFragment | undefined> =>
    createMutation({ variables: { input: { name } } })
      .then((res) => {
        void refetch()

        return res.data?.favorites.createList
      })
      .catch((err: Error) => {
        addError(err.message)

        return undefined
      })

  const rename = (id: string, name: string) =>
    renameMutation({ variables: { id, input: { name } } })
      .then(() => refetch())
      .catch((err: Error) => addError(err.message))

  const remove = (id: string) =>
    deleteMutation({ variables: { id } })
      .then(() => refetch())
      .catch((err: Error) => addError(err.message))

  return {
    lists: data?.favoritesLists ?? [],
    loading,
    error,
    refetch,
    create,
    rename,
    remove,
    saving: creating || renaming || deleting,
  }
}
