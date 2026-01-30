'use client';


import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getGoogleDriveImageUrl } from '@/lib/utils';
import Link from 'next/link';
import { EquipmentDetailModal } from '@/components/equipment/EquipmentDetailModal';
// import Image from 'next/image'; // GAS images might be external URLs, need config or standard img tag

interface EquipmentIndex {
    code: string;
    name: string;
    category: string;
    description: string;
    total: number;
    available: number;
    borrowed: number;
    image: string;
}

export default function EquipmentCatalogPage() {
    const { isAuthenticated } = useAuthStore();
    // const router = useRouter(); // No longer needed for details, maybe for other things? kept just in case or remove. Remove for clean up.
    const [catalog, setCatalog] = useState<EquipmentIndex[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    
    // Modal State
    const [selectedCode, setSelectedCode] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchCatalog();
    }, []);

    const fetchCatalog = async () => {
        try {
            setLoading(true);
            // Use POST if generic proxy issues, or GET. 
            // Controller supports GET (e.parameter).
            const res = await api.get('/equipment/catalog');
            if (res.data.success) {
                const data: EquipmentIndex[] = res.data.data;
                setCatalog(data);
                
                // Extract unique categories
                const cats = Array.from(new Set(data.map(item => item.category))).filter(Boolean);
                setCategories(['All', ...cats]);
            } else {
                console.error("Failed to fetch catalog:", res.data.message);
            }
        } catch (error) {
            console.error("Error fetching catalog:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCatalog = selectedCategory === 'All' 
        ? catalog 
        : catalog.filter(item => item.category === selectedCategory);

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">器材租借</h1>
                <Link href="/dashboard/applications">
                    <Button variant="outline">我的申請紀錄</Button>
                </Link>
            </div>
            
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
                {categories.map(cat => (
                    <Button 
                        key={cat} 
                        variant={selectedCategory === cat ? "default" : "outline"}
                        onClick={() => setSelectedCategory(cat)}
                        className={`whitespace-nowrap ${selectedCategory === cat ? 'border border-primary' : ''}`}
                    >
                        {cat}
                    </Button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-10">載入器材目錄中...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredCatalog.map((item) => (
                        <Card 
                            key={item.code} 
                            className="flex flex-col h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden p-0 gap-0"
                            onClick={() => {
                                setSelectedCode(item.code);
                                setIsModalOpen(true);
                            }}
                        >
                            <CardHeader className="p-0">
                                <div className="aspect-video w-full bg-gray-200 relative">
                                    {item.image ? (
                                        <img 
                                            src={getGoogleDriveImageUrl(item.image)} 
                                            alt={item.name} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image'; // Fallback
                                            }}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            No Image
                                        </div>
                                    )}
                                    <Badge className={`absolute top-2 right-2 ${
                                        item.available > 0 ? 'bg-green-500' : 'bg-red-500'
                                    }`}>
                                        {item.available > 0 ? `剩餘: ${item.available}` : '已借完'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{item.category}</div>
                                    <div className="text-xs text-gray-400 font-mono">{item.code}</div>
                                </div>
                                <CardTitle className="text-lg mb-2">{item.name}</CardTitle>
                                {/* <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p> */}
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                                <Button className="w-full" disabled={item.available <= 0} variant={item.available > 0 ? "default" : "secondary"}>
                                    檢視詳情
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
            
            <EquipmentDetailModal 
                code={selectedCode}
                open={isModalOpen} 
                onOpenChange={setIsModalOpen} 
            />
        </div>
    );
}
