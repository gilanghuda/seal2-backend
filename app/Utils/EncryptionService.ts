import Encryption from '@ioc:Adonis/Core/Encryption'

export default class EncryptionService {
  public encode(data: any): string {
    try {
      const jsonString = JSON.stringify(data)
      return Encryption.encrypt(jsonString)
    } catch (error) {
      const err = new Error('Failed to encode data')
      ;(err as any).code = 'E_ENCRYPTION_FAILED'
      throw err
    }
  }

 
  public decode(encryptedData: string): any {
    try {
      const decryptedString = Encryption.decrypt(encryptedData) as string
      return JSON.parse(decryptedString)
    } catch (error) {
      const err = new Error('Failed to decode data')
      ;(err as any).code = 'E_DECRYPTION_FAILED'
      throw err
    }
  }
}
