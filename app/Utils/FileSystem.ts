import Drive from '@ioc:Adonis/Core/Drive'
import { v4 as uuidv4 } from 'uuid'

export default class FileSystemHelper {

  public static generateFileName(originalName: string): string {
    const extension = originalName.split('.').pop()
    return `${uuidv4()}.${extension}`
  }

  public static async deleteFile(filePath: string): Promise<void> {
    try {
      if (await Drive.exists(filePath)) {
        await Drive.delete(filePath)
      }
    } catch (error) {
      console.error(`Error deleting file: ${filePath}`, error)
    }
  }


  public static async getFileUrl(filePath: string): Promise<string | null> {
    try {
      if (await Drive.exists(filePath)) {
        return Drive.getUrl(filePath)
      }
      return null
    } catch (error) {
      console.error(`Error getting file URL: ${filePath}`, error)
      return null
    }
  }
}
