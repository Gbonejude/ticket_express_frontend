import { ENDPOINTS, post, put } from '@/api'
import type { Ulid } from '@/types/api'
import type { ChangePasswordPayload, UpdateProfilePayload, User } from '@/types/user'

/**
 * The signed-in visitor's own account.
 *
 * Everything goes through `PUT /users/{id}` with the visitor's own id: the API
 * has no `me`-scoped write route. That route is only `auth:sanctum`-gated, so
 * the id has to come from the session — never from a route parameter or a
 * form field.
 */
export const accountService = {
  /** Updates personal details. Only the fields sent are changed. */
  updateProfile(id: Ulid, payload: UpdateProfilePayload): Promise<User> {
    return put<User, UpdateProfilePayload>(ENDPOINTS.users.update(id), payload)
  },

  /** Changes the password. The API has no "current password" check. */
  changePassword(id: Ulid, payload: ChangePasswordPayload): Promise<User> {
    return put<User, ChangePasswordPayload>(ENDPOINTS.users.update(id), payload)
  },

  /**
   * Replaces the profile picture.
   *
   * Posted as multipart with a `_method` override rather than sent as a real
   * PUT: PHP does not populate `$_FILES` for PUT bodies, so the upload would
   * arrive empty. Laravel reads the override and routes it to `update`.
   */
  updateAvatar(id: Ulid, file: File): Promise<User> {
    const body = new FormData()

    body.append('image', file)
    body.append('_method', 'PUT')

    return post<User, FormData>(ENDPOINTS.users.update(id), body)
  },
}
