
import React from 'react';
import MainLayout from '@/components/MainLayout';
import PrivacyPolicy from '@/components/PrivacyPolicy';

const PrivacyPolicyPage = () => {
  return (
    <MainLayout>
      <section className="py-8 px-4 w-full pb-28">
        <div className="max-w-[1400px] mx-auto">
          <PrivacyPolicy />
        </div>
      </section>
    </MainLayout>
  );
};

export default PrivacyPolicyPage;
