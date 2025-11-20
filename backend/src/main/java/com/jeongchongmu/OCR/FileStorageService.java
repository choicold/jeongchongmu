package com.jeongchongmu.OCR;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

/**
 * 영수증 저장하고 URL을 반환
 */
public interface FileStorageService {

    /**
     * @param file 클라이언트가 업로드한 파일
     * @return 스토리지에 저장된 파일의 고유 URL
     */
    String saveFile(MultipartFile file) throws IOException;
}