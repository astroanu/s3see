import { Injectable } from '@angular/core';
import * as AWS from 'aws-sdk';
import { S3 } from 'aws-sdk';
import { FileList } from '../../models/file-list/file-list.model';
import { FileListInterface } from '../../models/file-list/file-list.interface';
import { ConfigService } from '../config/config.service';
import { FileServiceInterface } from './file.service.interface';

@Injectable({
  providedIn: 'root'
})
export class FileService implements FileServiceInterface {
  private bucketName = this.config.defaultBucket;
  private s3: AWS.S3;

  public upload(key: string, data: Blob, progressCallback): Promise<object> {
    return new Promise((resolve, reject) => {
      this.s3
        .upload(
          {
            Body: data,
            Bucket: this.bucketName,
            Key: key
          },
          {
            partSize: 10 * 1024 * 1024,
            queueSize: 1
          },
          (err, data: S3.Types.PutObjectOutput) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          }
        )
        .on('httpUploadProgress', progressCallback);
    });
  }

  public initializeS3Object(): Promise<void> {
    return new Promise((resolve, reject) => {
      const credentials = this.config.getBucketCredentials(this.bucketName);

      if (!credentials) {
        reject();
      }
      return credentials
        .then(
          (creds) => {
            this.s3 = new AWS.S3(new AWS.Config(creds));
            resolve();
          },
          () => console.log('initializeS3Object failed')
        )
        .catch(() => reject());
    });
  }

  public getBucketName(): string {
    return this.bucketName;
  }

  public setBucket(bucketName: string): Promise<void> {
    if (bucketName) {
      this.bucketName = bucketName;

      return this.initializeS3Object();
    }
    return Promise.reject();
  }

  public listDirectories(prefix: string, continuationToken: null | string = null): Promise<FileListInterface> {
    return new Promise((resolve, reject) => {
      const params = { Bucket: this.bucketName };

      if (prefix) {
        params['Prefix'] = `${prefix}`;
      }

      params['Delimiter'] = '/';

      if (continuationToken) {
        params['ContinuationToken'] = continuationToken;
      }

      this.s3
        .listObjectsV2(params, (err, data: S3.Types.ListObjectsV2Output) => {
          if (err) {
            reject(err);
          } else {
            resolve(new FileList(this, data));
          }
        })
        .on('complete', (response) => {
          if (response.error) {
            reject(response.error);
          }
        });
    });
  }

  public listObjects(prefix: any, continuationToken = null): Promise<FileListInterface> {
    return new Promise((resolve, reject) => {
      const params = { Bucket: this.bucketName };

      if (prefix) {
        params['Prefix'] = `${prefix}`;
      }

      params['Delimiter'] = '/';

      if (continuationToken) {
        params['ContinuationToken'] = continuationToken;
      }

      this.s3.listObjectsV2(params, (err, data: S3.Types.ListObjectsV2Output) => {
        if (err) {
          reject(err);
        } else {
          resolve(new FileList(this, data));
        }
      });
    });
  }

  constructor(private config: ConfigService) {}
}
