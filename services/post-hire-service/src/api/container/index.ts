import { RepositoryContainer } from '@/api/container/repository.container';
import { ServiceContainer } from '@/api/container/service.container';
import { ControllerContainer } from '@/api/container/controller.container';

export class ContainerManager {
    static async initializeAll(): Promise<void> {
        console.log('🚀 Initializing all containers...');

        // Khởi tạo theo thứ tự phụ thuộc
        await RepositoryContainer.initialize();
        await ServiceContainer.initialize();
        await ControllerContainer.initialize();

        console.log('✅ All containers initialized successfully');
    }
}

