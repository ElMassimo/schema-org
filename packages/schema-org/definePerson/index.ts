import type { Arrayable, IdReference, Thing, WithAmbigiousFields } from '../types'
import { IdentityId, defineNodeResolver, prefixId, resolveImageUrls } from '../utils'
import type { ImageObject } from '../defineImage'

export interface Person extends Thing {
  /**
   * The full name of the Person.
   */
  name: string
  /**
   * The user bio, truncated to 250 characters.
   */
  description?: string
  /**
   * An array of URLs representing declared social/authoritative profiles of the person
   * (e.g., a Wikipedia page, or Facebook profile).
   */
  sameAs?: string[]
  /**
   * An array of images which represent the person, referenced by ID.
   */
  image?: Arrayable<IdReference|ImageObject|string>
  /**
   * The URL of the users' profile page (if they're affiliated with the site in question),
   * or to their personal homepage/website.
   */
  url?: string
}

type OptionalPersonKeys = '@id'|'@type'|'url'

/**
 * Describes an individual person. Most commonly used to identify the author of a piece of content (such as an Article or Comment).
 * @param person
 */
export function definePerson(person: WithAmbigiousFields<Person, OptionalPersonKeys>) {
  return defineNodeResolver<Person, OptionalPersonKeys>(person, {
    defaults({ canonicalHost }) {
      return {
        '@type': 'Person',
        '@id': prefixId(canonicalHost, IdentityId),
        'url': canonicalHost,
      }
    },
    resolve(person, { canonicalHost }) {
      if (person.image)
        person.image = resolveImageUrls(canonicalHost, person.image)
      return person
    },
  })
}
